# Collision Detection

## Overview
The collision detection system uses GPU acceleration to efficiently determine intersections between objects in the scene. It employs a multi-phase approach to handle large numbers of potential collisions.

## Broad Phase
- **Uniform Grid**: Simple spatial partitioning with fixed cell sizes
- **Spatial Hashing**: Hash-based approach for dynamic scenes
- **Bounding Volume Hierarchies (BVH)**: GPU-built and traversed trees
- **Parallel Frustum Culling**: View-space optimizations for visible objects

## Narrow Phase
- **Primitive Tests**: GPU-optimized GJK/EPA for convex shapes
- **Signed Distance Fields (SDF)**: Analytical distance queries for complex shapes
- **Mesh Collision**: GPU-accelerated triangle-triangle tests with BVH pruning
- **Ray Casting**: Efficient ray-object intersection for queries and sensors

## Temporal Coherence
- **Continuous Collision Detection (CCD)**: For fast-moving objects
- **Speculative Contacts**: Predictive collision response
- **Temporal Caching**: Reuse of collision results between frames

## Integration with Physics
- **Contact Generation**: Converting intersection data to physics constraints
- **Two-Way Coupling**: Interaction between different simulation systems (particles, rigid bodies, soft bodies)
- **Filtering System**: Collision masks and groups for selective interactions

## Code Example
```wgsl
// Compute shader for broad phase collision detection
@compute @workgroup_size(64)
fn broadPhaseCollisions(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= numObjects) {
        return;
    }
    
    let objectIndex = id.x;
    let objectAABB = objectAABBs[objectIndex];
    
    // Calculate grid cells this object overlaps
    let minCell = floor(objectAABB.min / cellSize);
    let maxCell = floor(objectAABB.max / cellSize);
    
    // Register object in each cell
    for (var x = minCell.x; x <= maxCell.x; x++) {
        for (var y = minCell.y; y <= maxCell.y; y++) {
            for (var z = minCell.z; z <= maxCell.z; z++) {
                let cellIndex = calculateCellIndex(vec3<u32>(x, y, z));
                
                // Atomically add object to cell's object list
                let slot = atomicAdd(&cellCounts[cellIndex], 1);
                if (slot < MAX_OBJECTS_PER_CELL) {
                    cellObjects[cellIndex * MAX_OBJECTS_PER_CELL + slot] = objectIndex;
                }
            }
        }
    }
}
```
