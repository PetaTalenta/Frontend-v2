#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ Starting Performance Optimization...\n');

// Check for unused imports
console.log('🔍 Checking for unused imports...');
const checkUnusedImports = () => {
  const srcDir = path.join(process.cwd(), 'src');
  const unusedImports = [];
  
  const scanFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for common unused import patterns
      const patterns = [
        /import.*from ['"]react['"];?\s*$/gm,
        /import.*from ['"]next['"];?\s*$/gm,
        /import.*from ['"]@radix-ui\/.*['"];?\s*$/gm,
        /import.*from ['"]lucide-react['"];?\s*$/gm,
        /import.*from ['"]recharts['"];?\s*$/gm,
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 1) {
          unusedImports.push({
            file: filePath,
            imports: matches.slice(1) // Skip the first one as it's likely used
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  };
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        scanFile(filePath);
      }
    });
  };
  
  scanDirectory(srcDir);
  
  if (unusedImports.length > 0) {
    console.log('⚠️  Potential unused imports found:');
    unusedImports.forEach(({ file, imports }) => {
      console.log(`  ${path.relative(process.cwd(), file)}:`);
      imports.forEach(imp => console.log(`    ${imp.trim()}`));
    });
  } else {
    console.log('✅ No obvious unused imports found');
  }
};

// Check for large components that could be code-split
console.log('\n📏 Checking component sizes...');
const checkComponentSizes = () => {
  const srcDir = path.join(process.cwd(), 'src');
  const largeComponents = [];
  
  const scanFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      
      if (lines > 200) {
        largeComponents.push({
          file: filePath,
          lines: lines
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  };
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        scanFile(filePath);
      }
    });
  };
  
  scanDirectory(srcDir);
  
  if (largeComponents.length > 0) {
    console.log('📊 Large components that could benefit from code splitting:');
    largeComponents
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 10)
      .forEach(({ file, lines }) => {
        console.log(`  ${path.relative(process.cwd(), file)}: ${lines} lines`);
      });
  } else {
    console.log('✅ All components are reasonably sized');
  }
};

// Check for missing dynamic imports
console.log('\n🔄 Checking for dynamic import opportunities...');
const checkDynamicImports = () => {
  const heavyLibraries = ['recharts', 'framer-motion', 'date-fns'];
  const srcDir = path.join(process.cwd(), 'src');
  const staticImports = [];
  
  const scanFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      heavyLibraries.forEach(lib => {
        const regex = new RegExp(`import.*from\\s+['"]${lib}['"]`, 'g');
        const matches = content.match(regex);
        
        if (matches && !content.includes('dynamic(')) {
          staticImports.push({
            file: filePath,
            library: lib,
            imports: matches
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  };
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        scanFile(filePath);
      }
    });
  };
  
  scanDirectory(srcDir);
  
  if (staticImports.length > 0) {
    console.log('⚡ Libraries that could use dynamic imports:');
    staticImports.forEach(({ file, library, imports }) => {
      console.log(`  ${path.relative(process.cwd(), file)}: ${library}`);
    });
  } else {
    console.log('✅ Heavy libraries are properly dynamically imported');
  }
};

// Check Next.js configuration optimizations
console.log('\n⚙️  Checking Next.js configuration...');
const checkNextConfig = () => {
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    const optimizations = [
      { name: 'Bundle Analyzer', pattern: /@next\/bundle-analyzer/ },
      { name: 'Image Optimization', pattern: /images.*unoptimized.*false/ },
      { name: 'Package Optimization', pattern: /optimizePackageImports/ },
      { name: 'Webpack Optimization', pattern: /webpack.*function/ },
      { name: 'Security Headers', pattern: /headers.*function/ }
    ];
    
    optimizations.forEach(({ name, pattern }) => {
      if (pattern.test(content)) {
        console.log(`  ✅ ${name} is configured`);
      } else {
        console.log(`  ❌ ${name} is missing`);
      }
    });
    
  } catch (error) {
    console.log('❌ Could not read next.config.mjs');
  }
};

// Run all checks
checkUnusedImports();
checkComponentSizes();
checkDynamicImports();
checkNextConfig();

// Performance recommendations
console.log('\n💡 Performance Recommendations:');
console.log('1. Use dynamic imports for heavy libraries (recharts, framer-motion)');
console.log('2. Implement proper code splitting for large components');
console.log('3. Remove unused imports and dependencies');
console.log('4. Optimize images with proper dimensions and formats');
console.log('5. Use React.memo for expensive components');
console.log('6. Implement proper caching strategies');

console.log('\n✅ Performance optimization analysis complete!');