// Node.js script to convert Shapefiles to GeoJSON
// Run: node convert_shapefiles.js
// Requires: npm install shapefile

const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

const inputDir = 'F:/IIT_Tirupati_Roads';
const outputDir = 'F:/IIT_Tirupati_Roads';

const filesToConvert = [
  { shp: 'IIT_Tirupati.shp', output: 'IIT_Tirupati.geojson' },
  { shp: 'IIT_Tirupati_Roads.shp', output: 'IIT_Tirupati_Roads.geojson' },
  { shp: 'IITT_Buildings.shp', output: 'IITT_Buildings.geojson' },
  { shp: 'Light_poles.shp', output: 'Light_poles.geojson' },
  { shp: 'IITT_Water_Bodies.shp', output: 'IITT_Water_Bodies.geojson' }
];

async function convertShapefile(inputFile, outputFile) {
  try {
    console.log(`Converting ${inputFile}...`);
    const source = await shapefile.open(path.join(inputDir, inputFile));
    const collection = await source.read();
    
    const geojson = {
      type: 'FeatureCollection',
      features: []
    };
    
    let result = await source.read();
    while (!result.done) {
      geojson.features.push(result.value);
      result = await source.read();
    }
    
    fs.writeFileSync(
      path.join(outputDir, outputFile),
      JSON.stringify(geojson, null, 2)
    );
    
    console.log(`✓ Converted ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error(`✗ Error converting ${inputFile}:`, error.message);
  }
}

async function convertAll() {
  console.log('Starting conversion...\n');
  for (const file of filesToConvert) {
    await convertShapefile(file.shp, file.output);
  }
  console.log('\nConversion complete!');
}

convertAll();




