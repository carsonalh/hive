#!/bin/bash

items=(*_normal.png)

for it in ${items[@]}; do
	size=$(cat $it | wc -c | numfmt --to=iec-i)
	jpg=$(echo $it | sed 's/\.png$/.jpg/')
	magick $it -resize 512x512 -blur 0x1 -quality 90% $jpg
	csz=$(cat $jpg | wc -c | numfmt --to=iec-i)
	echo "Compressed $it from $size to $csz"
done

