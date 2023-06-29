// Import dependencies
import base58 from "bs58";
import * as bitcoin from 'bitcoinjs-lib';
import { BIP322, Address } from 'bip322-js';
import { AddressType, getAddressType } from "./AddressType";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { AppClient, DefaultWalletPolicy } from 'ledger-bitcoin';

/**
 * Class that handles communication with the Ledger device to get things done.
 */
class LedgerAPI {

	// Constants
	LEGACY_PATH = "0'/0'/";
	SEGWIT_PATH = "49'/0'/";
	NATIVE_SEGWIT_PATH = "84'/0'/";
	TAPROOT_PATH = "86'/0'/";

	// AppClient object for communicating with the Ledger device
	ledgerClient: AppClient;

	/**
	 * Internal constructor for LedgerAPI class.
	 * @param ledgerClient AppClient instance from ledger-bitcoin
	 */
	private constructor(ledgerClient: AppClient) {
		this.ledgerClient = ledgerClient;
	}

	/**
	 * Public constructor for LedgerAPI class.
	 * @returns Initialized LedgerAPI instance
	 */
	public static async constructorAsync() {
		// Create a AppClient object for communicating with the Bitcoin software on Ledger device
		const transport = await TransportWebHID.create();
		const appClient = new AppClient(transport);
		return new LedgerAPI(appClient);
	}

	/**
	 * Get xpub addresses of a given wallet type and account numbers.
	 * @param addressType Bitcoin address type of the wallet
	 * @param from The lowest account number to be returned (inclusive), which is defined as basePath/from'
	 * @param to The highest account number to be returned (inclusive), which is defined as basePath/to'
	 * @returns Array of xpub addresses and the corresponding path used to derive each of the address
	 */
	public async getXPubAddress(addressType: AddressType, from: number, to: number) {
		// Temporary array for storing the xpub key generated
		const xpubs: Array<{ xpub: string, path: string }> = [];
		// Deteremine the path to use
		let basePath: string = "";
		switch (addressType) {
			case (AddressType.LEGACY):
				basePath = this.LEGACY_PATH;
				break;
			case (AddressType.SEGWIT):
				basePath = this.SEGWIT_PATH;
				break;
			case (AddressType.NATIVE_SEGWIT):
				basePath = this.NATIVE_SEGWIT_PATH;
				break;
			case (AddressType.TAPROOT):
				basePath = this.TAPROOT_PATH;
				break;
		}
		// Loop to generate xpub key for path from the given 'from' index to the given 'to' index
		for (let i=from; i<=to; i++) {
			const xpub = await this.ledgerClient.getExtendedPubkey(basePath + i + "'");
			xpubs.push({
				xpub: xpub,
				path: basePath + i + "'"
			});
		}
		return xpubs;
	}

	/**
	 * Signs a message using the legacy Bitcoin Message Signing standard under the provided deviation path.
	 * Although any deviation path can be provided, only legacy, segwit, (and sometimes native segwit) signature are verifiable.
	 * @param message Message to be signed
	 * @param deviationPath Deviation path of the address to be used to sign the message
	 * @returns Base64-encoded signature of the message
	 */
	public async signMessage(message: string, deviationPath: string) {
		// Sign the message with the given deviationPath
		const signedMessage = await this.ledgerClient.signMessage(Buffer.from(message), deviationPath);
		return signedMessage;
	}

	/**
	 * Sign a PSBT using the provided root deviation path.
	 * Note that the PSBT must be ready to be signed by a Ledger device with all necessary field propagated.
	 * If a PSBT is incorrectly constructed (e.g., missing a required field), it will usually result in 0x6a80 error.
	 * @param psbt PSBT to be signed by the Ledger device
	 * @param rootDeviationPath Root deviation path of the account to be signing the transaction (e.g., 86'/0'/0')
	 * @param type Type of address to be used to sign the message, must be either AddressType.SEGWIT, AddressType.NATIVE_SEGWIT, or AddressType.TAPROOT
	 * @returns An array of of tuples with 2 elements containing: the index of the input being signed, and an instance of PartialSignature
	 */
	public async signPSBT(psbt: string, rootDeviationPath: string, type: AddressType) {
		// Get master fingerprint and the xpub key of the account
		const fpr = await this.ledgerClient.getMasterFingerprint();
		const taprootAccountPubkey = await this.ledgerClient.getExtendedPubkey(`m/${rootDeviationPath}`);
		// Construct appropriate wallet policy for signing
		let accountPolicy: DefaultWalletPolicy;
		switch (type) {
			case AddressType.SEGWIT:
				accountPolicy = new DefaultWalletPolicy(
					"sh(wpkh(@0/**))",
					`[${fpr}/${rootDeviationPath}]${taprootAccountPubkey}`
				);
				break;
			case AddressType.NATIVE_SEGWIT:
				accountPolicy = new DefaultWalletPolicy(
					"wpkh(@0/**)",
					`[${fpr}/${rootDeviationPath}]${taprootAccountPubkey}`
				);
				break;
			case AddressType.TAPROOT:
				accountPolicy = new DefaultWalletPolicy(
					"tr(@0/**)",
					`[${fpr}/${rootDeviationPath}]${taprootAccountPubkey}`
				);
				break;
			default:
				throw new Error('Unable to sign using unsupported address type.');
		}
		// Send to the Ledger device for signing
		return await this.ledgerClient.signPsbt(psbt, accountPolicy, null);
	}

	/**
	 * Sign a BIP-322 message using a Ledger device.
	 * @param message message_challenge to be signed by the address 
	 * @param deviationPath The full deviation path to derive the address to be signing the toSignTx (e.g., m/86'/0'/0'/0/0)
	 * @param address Address to be signing the message
	 * @param pubKey The public key (for segwit or native segwit) or internal key (for taproot) of the address to be signing the toSignTx
	 * @returns The simple BIP-322 signature, encoded using base-64
	 */
	public async signBIP322(message: string, deviationPath: string, address: string, pubKey: Buffer) {
		// Convert address into scriptPubKey
		const scriptPubKey = Address.convertAdressToScriptPubkey(address);
		// Construct toSpend and toSign transaction as specified in BIP-322
		const toSpendTx = BIP322.buildToSpendTx(message, scriptPubKey);
		const toSpendTxId = toSpendTx.getId();
		// Derive the root deviation path for subsequent uses
		const rootDeviationPath = this.sliceFullPathToRootPath(deviationPath);
		if (!rootDeviationPath) {
			throw new Error ("Invalid deviation path provided.");
		}
		// Get master fingerprint and account xpub key
		const fpr = await this.ledgerClient.getMasterFingerprint();
		const accountPubkey = await this.ledgerClient.getExtendedPubkey(rootDeviationPath);
		// Get the type of the provided address
		const addressType = getAddressType(address);
		// Construct and sign the appropriate toSign PSBT depending on the address type
		let psbt: bitcoin.Psbt;
		if (addressType === AddressType.SEGWIT) {
			// P2SH-P2WPKH signing path
			psbt = this.buildToSignSegwit(toSpendTxId, deviationPath, scriptPubKey, pubKey, fpr, accountPubkey, toSpendTx);
			const result = await this.signPSBT(psbt.toBase64(), rootDeviationPath, addressType);
			psbt.updateInput(0, {
				partialSig: [result[0][1]]
			});
		}
		else if (addressType === AddressType.NATIVE_SEGWIT) {
			// P2WPKH signing path
			psbt = this.buildToSignNativeSegwit(toSpendTxId, deviationPath, scriptPubKey, pubKey, fpr, accountPubkey);
			const result = await this.signPSBT(psbt.toBase64(), rootDeviationPath, addressType);
			psbt.updateInput(0, {
				partialSig: [result[0][1]]
			});
		}
		else if (addressType === AddressType.TAPROOT) {
			// P2TR signing path
			psbt = this.buildToSignTaproot(toSpendTxId, deviationPath, scriptPubKey, pubKey, fpr, accountPubkey);
			const result = await this.signPSBT(psbt.toBase64(), rootDeviationPath, addressType);
			psbt.updateInput(0, {
				tapKeySig: result[0][1].signature
			});
		}
		else {
			throw new Error('Unable to sign BIP-322 message for unsupported address type.') // Unsupported address type
		}
		// Finalize the PSBT
		psbt.finalizeAllInputs();
		// Encode the witness stack into a simple BIP-322 signature
		const signature = BIP322.encodeWitness(psbt);
		return signature;
	}

	/**
	 * Construct the appropriate toSign PSBT for a segwit address.
	 * @param toSpendTxId Transaction ID of the to_spend transaction, as specified in BIP-322
	 * @param deviationPath The full deviation path to derive the address to be signing the toSignTx (e.g., m/49'/0'/0'/0/0)
	 * @param scriptPubKey The script public key of the address to be signing the toSignTx
	 * @param pubKey The public key of the address to be signing the toSignTx
	 * @param fingerprint Master fingerprint from the Ledger device
	 * @param accountPubkey XPub key of the account to be signing the toSign PSBT
	 * @param toSpendTx The toSpend transaction as required in BIP-322
	 * @returns toSign PSBT that is ready to be signed by a Ledger device
	 */
	private buildToSignSegwit(
		toSpendTxId: string, deviationPath: string, scriptPubKey: Buffer, pubKey: Buffer, 
		fingerprint: string, accountPubkey: string, toSpendTx: bitcoin.Transaction
	) {
		// Derive the corresponding redeem script
		const temp = bitcoin.payments.p2sh({ 
			redeem: { 
				output: bitcoin.payments.p2wpkh({ pubkey: pubKey, network: bitcoin.networks.bitcoin }).output 
			}, 
			network: bitcoin.networks.bitcoin 
		});
		const redeemScript = temp.redeem?.output;
		// Construct a P2SH-wrapped segwit PSBT
		const psbt = new bitcoin.Psbt()
			.setVersion(0) // nVersion = 0
			.setLocktime(0) // nLockTime = 0
			.addInput({
				hash: toSpendTxId, // vin[0].prevout.hash = to_spend.txid
				index: 0, // vin[0].prevout.n = 0
				sequence: 0, // vin[0].nSequence = 0
				witnessUtxo: { value: 0, script: scriptPubKey },
				nonWitnessUtxo: toSpendTx.toBuffer(),
				redeemScript: redeemScript,
				bip32Derivation: [{
					masterFingerprint: Buffer.from(fingerprint, 'hex'),
					pubkey: pubKey,
					path: deviationPath
				}]
			})
			.addOutput({
				value: 0, // vout[0].nValue = 0
				script: Buffer.from([0x6a]) // vout[0].scriptPubKey = OP_RETURN
			});
		// Add global xpub key information
		psbt.updateGlobal({
			globalXpub: [{
				extendedPubkey: Buffer.from(base58.decode(accountPubkey)).slice(0, -4),
				masterFingerprint: Buffer.from(fingerprint, 'hex'),
				path: deviationPath
			}]
		});
		return psbt;
	}

	/**
	 * Construct the appropriate toSign PSBT for a native segwit address.
	 * @param toSpendTxId Transaction ID of the to_spend transaction, as specified in BIP-322
	 * @param deviationPath The full deviation path to derive the address to be signing the toSignTx (e.g., m/84'/0'/0'/0/0)
	 * @param scriptPubKey The script public key of the address to be signing the toSignTx
	 * @param pubKey The public key of the address to be signing the toSignTx
	 * @param fingerprint Master fingerprint from the Ledger device
	 * @param accountPubkey XPub key of the account to be signing the toSign PSBT
	 * @returns toSign PSBT that is ready to be signed by a Ledger device
	 */
	private buildToSignNativeSegwit(
		toSpendTxId: string, deviationPath: string, scriptPubKey: Buffer, pubKey: Buffer, 
		fingerprint: string, accountPubkey: string
	) {
		// Construct a native segwit PSBT
		const psbt = new bitcoin.Psbt()
			.setVersion(0) // nVersion = 0
			.setLocktime(0) // nLockTime = 0
			.addInput({
				hash: toSpendTxId, // vin[0].prevout.hash = to_spend.txid
				index: 0, // vin[0].prevout.n = 0
				sequence: 0, // vin[0].nSequence = 0
				witnessUtxo: { value: 0, script: scriptPubKey },
				bip32Derivation: [{
					masterFingerprint: Buffer.from(fingerprint, 'hex'),
					pubkey: pubKey,
					path: deviationPath
				}]
			})
			.addOutput({
				value: 0, // vout[0].nValue = 0
				script: Buffer.from([0x6a]) // vout[0].scriptPubKey = OP_RETURN
			});
		// Add global xpub key information
		psbt.updateGlobal({
			globalXpub: [{
				extendedPubkey: Buffer.from(base58.decode(accountPubkey)).slice(0, -4),
				masterFingerprint: Buffer.from(fingerprint, 'hex'),
				path: deviationPath
			}]
		});
		return psbt;
	}

	/**
	 * Construct the appropriate toSign PSBT for a taproot address.
	 * @param toSpendTxId Transaction ID of the to_spend transaction, as specified in BIP-322
	 * @param deviationPath The full deviation path to derive the address to be signing the toSignTx (e.g., m/86'/0'/0'/0/0)
	 * @param scriptPubKey The script public key of the address to be signing the toSignTx
	 * @param pubKey The internal key of the address to be signing the toSignTx
	 * @param fingerprint Master fingerprint from the Ledger device
	 * @param accountPubkey XPub key of the account to be signing the toSign PSBT
	 * @returns toSign PSBT that is ready to be signed by a Ledger device
	 */
	private buildToSignTaproot(
		toSpendTxId: string, deviationPath: string, scriptPubKey: Buffer, pubKey: Buffer, 
		fingerprint: string, accountPubkey: string
	) {
		// Construct a taproot PSBT
		const psbt = new bitcoin.Psbt()
			.setVersion(0) // nVersion = 0
			.setLocktime(0) // nLockTime = 0
			.addInput({
				hash: toSpendTxId, // vin[0].prevout.hash = to_spend.txid
				index: 0, // vin[0].prevout.n = 0
				sequence: 0, // vin[0].nSequence = 0
				witnessUtxo: { value: 0, script: scriptPubKey },
				tapInternalKey: pubKey,
				tapBip32Derivation: [{
					masterFingerprint: Buffer.from(fingerprint, 'hex'),
					pubkey: pubKey,
					path: deviationPath,
					leafHashes: []
				}]
			})
			.addOutput({
				value: 0, // vout[0].nValue = 0
				script: Buffer.from([0x6a]) // vout[0].scriptPubKey = OP_RETURN
			});
		// Add global xpub key information
		psbt.updateGlobal({
			globalXpub: [{
				extendedPubkey: Buffer.from(base58.decode(accountPubkey)).slice(0, -4),
				masterFingerprint: Buffer.from(fingerprint, 'hex'),
				path: deviationPath
			}]
		});
		return psbt;
	}

	/**
	 * Convert a full deviation path to its root deviation path.
	 * @param fullDeviationPath A full deviation path (e.g., m/86'/0'/0'/0/0)
	 * @returns Corresponding root deviation path (e.g., 86'/0'/0')
	 */
	private sliceFullPathToRootPath(fullDeviationPath: string) {
		const pathComponents = fullDeviationPath.split("/");
		if (pathComponents.length > 4) {
			return `${pathComponents[1]}/${pathComponents[2]}/${pathComponents[3]}`
		}
		else {
			console.error('Invalid argument to sliceFullPathToRootPath');
			return undefined;
		}
	}
	
}

export default LedgerAPI;