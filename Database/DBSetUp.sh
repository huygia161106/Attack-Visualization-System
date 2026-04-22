#!/bin/bash
set -e

echo "Extracting GeoLite2-City.rar..."
unrar x GeoLite2-City.rar

cd GeoLite2-City/

echo "GeoLite2-City database extracted successfully!"
echo "Database file: $(ls *.mmdb 2>/dev/null | head -1)"

# If you need to use the .mmdb file in your Java application:
# Copy it to a known location that your backend can read
cp *.mmdb /app/data/GeoLite2-City.mmdb 2>/dev/null || true

echo "Database setup completed!"