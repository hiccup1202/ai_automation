#!/bin/bash
echo "=== Cleaning up redundant documentation files ==="
echo ""
echo "Files to be removed:"
echo "  1. AI_ENGINE_SUMMARY.md"
echo "  2. COMPLETED_WORK_SUMMARY.md"
echo "  3. PRISMA_SETUP_SUMMARY.md"
echo "  4. PROJECT_SUMMARY.md"
echo "  5. USAGE_GUIDES_SUMMARY.md"
echo "  6. SETUP.md"
echo "  7. DOCUMENTATION_INDEX.md"
echo "  8. backend/README_PRISMA.md"
echo ""
echo "This will free up ~94KB of redundant documentation."
echo ""
read -p "Do you want to proceed? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -v AI_ENGINE_SUMMARY.md
    rm -v COMPLETED_WORK_SUMMARY.md
    rm -v PRISMA_SETUP_SUMMARY.md
    rm -v PROJECT_SUMMARY.md
    rm -v USAGE_GUIDES_SUMMARY.md
    rm -v SETUP.md
    rm -v DOCUMENTATION_INDEX.md
    rm -v backend/README_PRISMA.md
    echo ""
    echo "✅ Cleanup complete!"
    echo ""
    echo "Remaining documentation:"
    find . -name "*.md" -type f | grep -v node_modules | sort
else
    echo "Cancelled."
fi
