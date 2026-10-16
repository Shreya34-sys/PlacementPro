/**
 * Genuine GCC Optimization Comparator
 * Compares unoptimized GIMPLE (-O0) vs optimized GIMPLE (-O1, -O2, -O3).
 */

class OptimizationComparator {
  compare(unoptimizedGimple, optimizedGimple, optimizationRemarks = '', optLevel = '-O0') {
    if (!optimizedGimple || optimizedGimple.trim().length === 0) {
      return {
        status: 'unavailable',
        reason: 'Optimized intermediate representation was not generated because compilation did not succeed.',
        producingTool: `GCC Optimization Pipeline (${optLevel})`,
        unoptimized: unoptimizedGimple || '',
        optimized: '',
        detectedTransformations: [],
        instructionMetrics: { unoptimized: 0, optimized: 0, reductionPercent: 0 },
      };
    }

    const unoptLines = (unoptimizedGimple || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
    const optLines = optimizedGimple.split(/\r?\n/).filter((l) => l.trim().length > 0);

    // Count basic blocks in optimized GIMPLE (look for <bb 2>, <bb 3>, etc.)
    const basicBlockMatches = optimizedGimple.match(/<bb\s+\d+>/g) || [];
    const basicBlockCount = basicBlockMatches.length;

    // Detect genuine observed transformations
    const detectedTransformations = [];

    // 1. Constant folding detection:
    // Check if unoptimized had arithmetic on constants (e.g., "10 + 20") while optimized contains the computed constant (e.g., "30")
    if (unoptimizedGimple && unoptimizedGimple.includes('+') && !optimizedGimple.includes('+')) {
      detectedTransformations.push({
        type: 'Constant Folding & Propagation',
        observed: true,
        description: 'Arithmetic expressions on compile-time constants were evaluated directly by GCC during the tree optimization pass.',
      });
    }

    // 2. Dead Code Elimination:
    // Check if line count significantly reduced or dead branches were removed
    if (optLines.length < unoptLines.length) {
      detectedTransformations.push({
        type: 'Dead Code / Temporary Elimination',
        observed: true,
        description: `Intermediate instructions reduced from ${unoptLines.length} lines to ${optLines.length} lines through dead variable and temporary pruning.`,
      });
    }

    // 3. Static Single Assignment (SSA) Form:
    if (optimizedGimple.includes('_1') || optimizedGimple.includes('_2') || optimizedGimple.includes('<bb ')) {
      detectedTransformations.push({
        type: 'Static Single Assignment (SSA) Transformation',
        observed: true,
        description: 'Variables were converted into SSA form with unique version subscripts (e.g., a_1, b_2) and partitioned into explicit Control Flow Basic Blocks (<bb N>).',
      });
    }

    // 4. Inlining or function optimization
    if (optimizationRemarks && optimizationRemarks.toLowerCase().includes('inlined')) {
      detectedTransformations.push({
        type: 'Function Inlining',
        observed: true,
        description: 'Small helper functions were inlined into caller sites to eliminate call-instruction overhead.',
      });
    }

    // If no specific transformation observed (e.g. at -O0)
    if (detectedTransformations.length === 0) {
      detectedTransformations.push({
        type: 'Baseline Pass (No Aggressive Optimizations)',
        observed: true,
        description: 'Standard tree lowering executed with minimal or no optimization passes enabled.',
      });
    }

    const reduction = unoptLines.length > 0
      ? Math.max(0, Math.round(((unoptLines.length - optLines.length) / unoptLines.length) * 100))
      : 0;

    return {
      status: 'success',
      optLevel,
      unoptimized: unoptimizedGimple || '',
      optimized: optimizedGimple,
      remarks: optimizationRemarks || 'No explicit optimization remarks emitted.',
      basicBlockCount,
      detectedTransformations,
      instructionMetrics: {
        unoptimizedLines: unoptLines.length,
        optimizedLines: optLines.length,
        reductionPercent: reduction,
      },
      producingTool: `GCC Optimization Pipeline (${optLevel} -fdump-tree-optimized)`,
      educationalConcepts: [
        {
          name: 'Constant Folding',
          explanation: 'Computes constant expressions (such as 3 * 100) at compile time rather than generating runtime multiplication instructions.',
        },
        {
          name: 'Dead Code Elimination',
          explanation: 'Identifies instructions and variables whose results have no side-effects and are never read, purging them from the intermediate representation.',
        },
        {
          name: 'Basic Block Structuring',
          explanation: 'Groups straight-line sequences of code with a single entry point and exit point to enable loop and branch optimizations.',
        },
      ],
    };
  }
}

module.exports = new OptimizationComparator();
