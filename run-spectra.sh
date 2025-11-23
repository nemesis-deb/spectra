#!/bin/bash
# Spectra launcher script
# This launches the extracted AppImage version which works around SIGSEGV issues

cd "$(dirname "$0")/dist/squashfs-root"
./spectra --no-sandbox "$@"
