# Converting Shapefiles to GeoJSON

Your data folder contains Shapefiles (.shp), but the web application needs GeoJSON files. Here are several ways to convert them:

## Method 1: Using QGIS (Easiest - GUI)

1. Open QGIS
2. Go to **Layer > Add Layer > Add Vector Layer**
3. Select your .shp file (e.g., `IIT_Tirupati.shp`)
4. Right-click the layer in the Layers panel
5. Select **Export > Save Features As...**
6. Choose **GeoJSON** as the format
7. Save with the same name (e.g., `IIT_Tirupati.geojson`)
8. Repeat for all shapefiles:
   - IIT_Tirupati.shp → IIT_Tirupati.geojson
   - IIT_Tirupati_Roads.shp → IIT_Tirupati_Roads.geojson
   - IITT_Buildings.shp → IITT_Buildings.geojson
   - Light_poles.shp → Light_poles.geojson
   - IITT_Water_Bodies.shp → IITT_Water_Bodies.geojson

## Method 2: Using ogr2ogr (Command Line)

If you have GDAL installed:

```bash
cd F:\IIT_Tirupati_Roads

ogr2ogr -f GeoJSON IIT_Tirupati.geojson IIT_Tirupati.shp
ogr2ogr -f GeoJSON IIT_Tirupati_Roads.geojson IIT_Tirupati_Roads.shp
ogr2ogr -f GeoJSON IITT_Buildings.geojson IITT_Buildings.shp
ogr2ogr -f GeoJSON Light_poles.geojson Light_poles.shp
ogr2ogr -f GeoJSON IITT_Water_Bodies.geojson IITT_Water_Bodies.shp
```

## Method 3: Using Node.js Script

1. Install Node.js if not already installed
2. Install shapefile library:
   ```bash
   npm install shapefile
   ```
3. Update the paths in `convert_shapefiles.js` if needed
4. Run:
   ```bash
   node convert_shapefiles.js
   ```

## Method 4: Online Converter

Use an online tool like:
- https://mapshaper.org/ (Upload .shp file, export as GeoJSON)
- https://www.convertcsv.com/shapefile-to-geojson.htm

## After Conversion

Once you have the GeoJSON files in the `F:\IIT_Tirupati_Roads` folder, update the `basePath` variable in `script.js` to point to the correct location relative to your HTML file.

For example, if your HTML is in `F:\iit tirupati 360\` and data is in `F:\IIT_Tirupati_Roads\`, use:
```javascript
const basePath = "../IIT_Tirupati_Roads/";
```




