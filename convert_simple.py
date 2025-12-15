"""
Simple Shapefile to GeoJSON Converter (Alternative)
Uses fiona and json - lighter weight than geopandas
Requires: pip install fiona
Run: python convert_simple.py
"""

import json
import os
from pathlib import Path

try:
    import fiona
    from fiona.crs import from_epsg
except ImportError:
    print("ERROR: fiona not installed!")
    print("Please install it using: pip install fiona")
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
    """Convert a single shapefile to GeoJSON using fiona"""
    try:
        input_path = input_dir / shp_file
        output_path = output_dir / output_file
        
        if not input_path.exists():
            print(f"[ERROR] File not found: {input_path}")
            return False
        
        print(f"Converting {shp_file}...")
        
        # Read shapefile and convert to GeoJSON
        features = []
        with fiona.open(str(input_path), 'r') as src:
            # Get CRS
            crs = src.crs
            
            for feature in src:
                # Convert geometry to dict
                geometry = feature.geometry
                if not isinstance(geometry, dict):
                    if hasattr(geometry, '__geo_interface__'):
                        geometry = geometry.__geo_interface__
                    else:
                        # Convert Geometry object to dict
                        geometry = dict(geometry) if hasattr(geometry, '__dict__') else geometry
                
                # Convert properties to dict
                properties = feature.properties
                if not isinstance(properties, dict):
                    if hasattr(properties, '__dict__'):
                        properties = dict(properties)
                    elif hasattr(properties, 'items'):
                        properties = dict(properties.items())
                    else:
                        properties = {}
                
                # Convert to GeoJSON format
                geojson_feature = {
                    "type": "Feature",
                    "geometry": geometry,
                    "properties": properties
                }
                features.append(geojson_feature)
        
        # Create FeatureCollection
        geojson_collection = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_collection, f, indent=2, ensure_ascii=False)
        
        print(f"[OK] Successfully converted to {output_file}")
        print(f"  Features: {len(features)}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error converting {shp_file}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Shapefile to GeoJSON Converter (Simple)")
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

