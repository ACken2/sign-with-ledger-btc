// Import dependencies
import * as bitcoin from 'bitcoinjs-lib';
import ecc from '@bitcoinerlab/secp256k1';
import BIP32Factory, { BIP32API } from 'bip32';
import { AddressType, getAddressType } from './AddressType';

/**
 * Class that performs BIP-32 key derivation.
 */
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
     * @param searchFrom Define the beginning of the search space, which is defined as xpub/0/searchFrom
     * @param searchTo Define the end of the search space, which is defined as xpub/0/searchTo
     * @returns Path which can derive the given address using the xpub key provided together with its script public key, or undefined if the address could not be derived under the provided settings
     */
    public findAddressPathAndKey(xpub: string, xpubBasePath: string, address: string, searchFrom: number, searchTo: number) {
        // Get the type of the provided address
        const addressType = getAddressType(address);
        // Loop to attempt to derive the given address using the provided xpub
        let i = searchFrom;
        while (i <= searchTo) {
            // Derive an address
            const result = this.deriveAddress(xpub, i, addressType);
            // Return the deviation path if it matches with the provided address
            if (result.derivedAddress === address) {
                return {
                    path: 'm/' + xpubBasePath + '/0/' + i,
                    scriptPubKey: result.scriptPubKey as Buffer,
                    publicKey: result.publicKey
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
     * @param addressType Bitcoin address type of the wallet
     * @returns Derived Bitcoin address, and its associated script public key based on the given setting
     */
    public deriveAddress(xpub: string, addressNumber: number, addressType: AddressType) {
        // Derive the associated public key with the xpub and address number
        const publicKey = this.bip32.fromBase58(xpub).derive(0).derive(addressNumber).publicKey;
        // Derive the address
        let result: { derivedAddress: string | undefined, scriptPubKey: Buffer | undefined, publicKey: Buffer };
        let temp;
        switch (addressType) {
            case (AddressType.LEGACY):
                temp = bitcoin.payments.p2pkh({
                    pubkey: publicKey,
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output,
                    publicKey: publicKey
                }
                break;
            case (AddressType.SEGWIT):
                temp = bitcoin.payments.p2sh({ 
                    redeem: { 
                        output: bitcoin.payments.p2wpkh({ pubkey: publicKey, network: bitcoin.networks.bitcoin }).output 
                    }, 
                    network: bitcoin.networks.bitcoin 
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output,
                    publicKey: publicKey
                }
                break;
            case (AddressType.NATIVE_SEGWIT):
                temp = bitcoin.payments.p2wpkh({
                    pubkey: publicKey,
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output,
                    publicKey: publicKey
                }
                break;
            case (AddressType.TAPROOT):
                bitcoin.initEccLib(ecc);
                // Based on https://github.com/bitcoinjs/bip32/blob/08a8a5288daaa989afc5436b6067808fa734ab50/src/bip32.js#L96, and
                // https://github.com/LedgerHQ/ledger-live/blob/b71717badef30a045418e79a5f7e355c07ec2dfb/libs/ledgerjs/packages/hw-app-btc/src/newops/accounttype.ts#L246
                temp = bitcoin.payments.p2tr({
                    internalPubkey: publicKey.subarray(1, 33),
                    network: bitcoin.networks.bitcoin
                });
                result = {
                    derivedAddress: temp.address,
                    scriptPubKey: temp.output,
                    publicKey: publicKey.subarray(1, 33)
                }
                break;
        }
        return result;
    }

}

export default BIP32;