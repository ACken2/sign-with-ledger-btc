// Import dependencies
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory, { BIP32API } from 'bip32';

class BIP32 {

    bip32: BIP32API; // BIP32 API

    constructor() {
        this.bip32 = BIP32Factory(ecc);
    }

    /**
     * Brute-force compute the path and script public key associated with a given address based on the given xpub key.
     * @param xpub XPub key for attempting to brute-force the path of the address
     * @param xpubBasePath Path used to derive the xpub key
     * @param address Target address to be brute-force computed
     * @param addressType Bitcoin address type of the address, must be either "legacy", "segwit", "native_segwit", or "taproot"
     * @param searchFrom Define the beginning of the search space, which is defined as xpub/0/searchFrom
     * @param searchTo Define the end of the search space, which is defined as xpub/0/searchTo
     * @returns Path which can derive the given address using the xpub key provided together with its script public key, or undefined if the address could not be derived under the provided settings
     */
    public findAddressPathAndKey(
        xpub: string, xpubBasePath: string, 
        address: string, addressType: "legacy" | "segwit" | "native_segwit" | "taproot", 
        searchFrom: number, searchTo: number
    ) {
        let i = searchFrom;
        while (i <= searchTo) {
            // Derive an address
            const result = this.deriveAddress(xpub, i, addressType);
            // Return the deviation path if it matches with the provided address
            if (result.derivedAddress === address) {
                return {
                    path: xpubBasePath + '/0/' + i,
                    publicKey: result.scriptPubKey as Buffer
                }
            }
            i++; // If not, try with the next index
        }
        // Return undefined if not found
        return undefined;
    }

    /**
     * Derive the Bitcoin address based on the given xpub key, address number using the given address type.
     * @param xpub XPub key for deriving the address
     * @param addressNumber Address number to be derived, i.e., the actual public key would be derived based on xpub/0/addressNumber
     * @param addressType Bitcoin address type of the wallet, must be either "legacy", "segwit", "native_segwit", or "taproot"
     * @returns Derived Bitcoin address, and its associated script public key based on the given setting
     */
    public deriveAddress(xpub: string, addressNumber: number, addressType: "legacy" | "segwit" | "native_segwit" | "taproot") {
        // Derive the associated public key with the xpub and address number
        const publicKey = this.bip32.fromBase58(xpub).derive(0).derive(addressNumber).publicKey;
        // Derive the address
        let result: { derivedAddress: string | undefined, scriptPubKey: Buffer | undefined };
        let temp;
        switch (addressType) {
            case ("segwit"):
                temp = bitcoin.payments.p2sh({ 
                    redeem: { 
                        output: bitcoin.payments.p2wpkh({ pubkey: publicKey, network: bitcoin.networks.bitcoin }).output 
                    }, 
                    network: bitcoin.networks.bitcoin 
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output
                }
                break;
            case ("native_segwit"):
                temp = bitcoin.payments.p2wpkh({
                    pubkey: publicKey,
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output
                }
                break;
            case ("taproot"):
                bitcoin.initEccLib(ecc);
                // Based on https://github.com/bitcoinjs/bip32/blob/08a8a5288daaa989afc5436b6067808fa734ab50/src/bip32.js#L96, and
                // https://github.com/LedgerHQ/ledger-live/blob/b71717badef30a045418e79a5f7e355c07ec2dfb/libs/ledgerjs/packages/hw-app-btc/src/newops/accounttype.ts#L246
                temp = bitcoin.payments.p2tr({
                    internalPubkey: publicKey.subarray(1, 33),
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output
                }
                break;
            default:
                temp = bitcoin.payments.p2pkh({
                    pubkey: publicKey,
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output
                }
                break;
        }
        return result;
    }

}

export default BIP32;