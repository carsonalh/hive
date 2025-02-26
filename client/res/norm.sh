items=(*.svg)

for it in ${items[@]}; do
	echo "Rasterising and blurring $it ..."
	png=$(echo $it | sed 's/\.svg$/.png/')
	magick $it \
		-colorspace Gray -depth 16 -alpha off \
		-blur 0x4 \
		$png
	echo "Computing normals for $png ..."
	pngn=$(echo $png | sed 's/\.png$/_normal.png/')
	normalmap -i $png -o $pngn -s -.5
done
