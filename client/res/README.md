# Generated Assets

SVGs (though plaintext) very efficiently encode our images, as they are solid
shapes. Therefore, we send svgs for the pieces' color maps to be sent over the
network.

A Hive tile, upon close inspection, is beveled inwards where the piece is
coloured in. We use this to generate depth maps (by blurring the image), and
normal maps from those.

To fine-tune the outputted normal maps (we generate 512x512 JPGs), you will need
the following installed:

- ImageMagic version 7 (or later) with both a PNG and JPG coder
- `normalmap` from <https://github.com/realh/normalmap.git>

Run `./norm.sh` to generate the uncompressed normal map, and then `./comp.sh` to
compress it to JPG ready to be bundled with hive.

