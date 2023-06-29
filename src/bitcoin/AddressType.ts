// Import dependency
import { Address } from "bip322-js";

// Defines the type of address used within the application
enum AddressType {
    LEGACY, // P2PKH
    SEGWIT, // P2SH-P2WPKH
    NATIVE_SEGWIT, // P2WPKH
    TAPROOT // P2TR
}

/**
 * Get the type of the provided address.
 * @param address Address to be checked
 * @returns Type of the address
 */
function getAddressType(address: string) {
    if (Address.isP2PKH(address)) {
        return AddressType.LEGACY;
    }
    else if (Address.isP2SH(address)) {
        return AddressType.SEGWIT;
    }
    else if (Address.isP2WPKH(address)) {
        return AddressType.NATIVE_SEGWIT;
    }
    else if (Address.isP2TR(address)) {
        return AddressType.TAPROOT;
    }
    else {
        throw new Error('Unsupported address type.');
    }
}

export { AddressType, getAddressType };