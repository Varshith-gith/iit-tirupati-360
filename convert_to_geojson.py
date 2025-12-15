"""
Convert Shapefiles to GeoJSON
Requires: pip install geopandas
Run: python convert_to_geojson.py
"""

import os
import json
from pathlib import Path

try:
    import geopandas as gpd
except ImportError:
    print("ERROR: geopandas not installed!")
    print("Please install it using: pip install geopandas")
    print("Or use: conda install geopandas")
    exit(1)

# Input and output directories
input_dir = Path(r"F:\IIT_Tirupati_Roads")
output_dir = Path(r"F:\IIT_Tirupati_Roads")

# Files to convert
files_to_convert = [
    "IIT_Tirupati.shp",
    "IIT_Tirupati_Roads.shp",
    "IITT_Buildings.shp",
    "Light_poles.shp",
    "IITT_Water_Bodies.shp"
]

def convert_shapefile_to_geojson(shp_file, output_file):
    """Convert a single shapefile to GeoJSON"""
    try:
        input_path = input_dir / shp_file
        output_path = output_dir / output_file
        
        if not input_path.exists():
            print(f"✗ File not found: {input_path}")
            return False
        
        print(f"Converting {shp_file}...")
        
        # Read shapefile
        gdf = gpd.read_file(input_path)
        
        # Convert to GeoJSON
        geojson = gdf.to_json()
        
        # Parse and pretty print
        geojson_data = json.loads(geojson)
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Successfully converted to {output_file}")
        print(f"  Features: {len(gdf)}")
        print(f"  Columns: {', '.join(gdf.columns.tolist())}")
        return True
        
    except Exception as e:
        print(f"✗ Error converting {shp_file}: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Shapefile to GeoJSON Converter")
    print("=" * 60)
    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    print()
    
    if not input_dir.exists():
        print(f"ERROR: Input directory does not exist: {input_dir}")
        return
    
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    total_count = len(files_to_convert)
    
    for shp_file in files_to_convert:
        # Generate output filename
        output_file = shp_file.replace('.shp', '.geojson')
        
        if convert_shapefile_to_geojson(shp_file, output_file):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"Conversion complete: {success_count}/{total_count} files converted")
    print("=" * 60)
    
    if success_count == total_count:
        print("\nAll files converted successfully!")
        print("You can now use these GeoJSON files in your web application.")
    else:
        print(f"\nWarning: {total_count - success_count} file(s) failed to convert.")

if __name__ == "__main__":
    main()




