<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Pure-PHP base58 (Bitcoin alphabet) — no extensions, no external
 * package. We've twice tripped over `stephenhill/base58` being in
 * composer.json but missing from vendor/ on the deployed environment;
 * SIWS / Profile / Loan all parse + render base58 strings, so a
 * stable in-tree helper avoids resurrecting that bug for the third
 * time.
 *
 * Drop-in API mirror of `StephenHill\Base58`: a no-arg constructor
 * plus instance `encode(string $bytes): string` /
 * `decode(string $b58): string` methods, so call sites can swap by
 * changing only the `use` line.
 */
class Base58
{
    private const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    public function encode(string $bytes): string
    {
        // Leading zero bytes map 1:1 to leading "1" chars in base58. Strip
        // them up-front; prepend at the end after the digit conversion.
        $leadingZeros = 0;
        $len = strlen($bytes);
        while ($leadingZeros < $len && $bytes[$leadingZeros] === "\x00") {
            $leadingZeros++;
        }

        $nums = array_values(unpack('C*', $bytes) ?: []);

        $output = '';
        while (!empty($nums)) {
            $newNums = [];
            $remainder = 0;
            $started = false;
            foreach ($nums as $byte) {
                $value = $remainder * 256 + $byte;
                $quotient = intdiv($value, 58);
                $remainder = $value % 58;
                if ($started || $quotient !== 0) {
                    $newNums[] = $quotient;
                    $started = true;
                }
            }
            $output = self::ALPHABET[$remainder] . $output;
            $nums = $newNums;
        }

        return str_repeat('1', $leadingZeros) . $output;
    }

    public function decode(string $b58): string
    {
        if ($b58 === '') {
            return '';
        }

        // Leading "1"s map back to leading zero bytes.
        $leadingOnes = 0;
        $len = strlen($b58);
        while ($leadingOnes < $len && $b58[$leadingOnes] === '1') {
            $leadingOnes++;
        }

        $alphabetMap = array_flip(str_split(self::ALPHABET));

        // Convert base58 → big integer represented as bytes via long
        // multiplication (multiply by 58, add digit).
        $bytes = [];
        for ($i = $leadingOnes; $i < $len; $i++) {
            $char = $b58[$i];
            if (!isset($alphabetMap[$char])) {
                throw new \InvalidArgumentException("Invalid base58 character: '{$char}'");
            }
            $carry = $alphabetMap[$char];
            for ($j = 0; $j < count($bytes); $j++) {
                $value = $bytes[$j] * 58 + $carry;
                $bytes[$j] = $value & 0xFF;
                $carry = $value >> 8;
            }
            while ($carry > 0) {
                $bytes[] = $carry & 0xFF;
                $carry >>= 8;
            }
        }

        // Bytes accumulated in little-endian order; reverse, prepend zeros.
        $bytes = array_reverse($bytes);
        $out = '';
        for ($i = 0; $i < $leadingOnes; $i++) {
            $out .= "\x00";
        }
        foreach ($bytes as $b) {
            $out .= chr($b);
        }

        return $out;
    }
}
