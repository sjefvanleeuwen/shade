# Procedural Animation

## Overview
Procedural animation uses algorithms and real-time computations to generate and modify animations dynamically rather than relying solely on pre-authored animation data. Shade Engine leverages the power of compute shaders to create responsive, adaptive animations that can react to game state and player input.

## Core Techniques
- **Inverse Kinematics (IK)**: Goal-oriented posing for limbs and chains
- **Procedural Walks**: Dynamic locomotion generation and adaptation
- **Physics-Based Animation**: Simulation-driven motion and secondary effects
- **Blendshape Generation**: Algorithmic facial animation and expressions
- **Pose Space Deformation**: Procedural muscle and skin system

## GPU-Accelerated Methods
- **Parallel IK Solving**: Compute shader-based multi-bone IK
- **Pose Evaluation**: Fast animation mixing and procedural adjustments
- **Constraint Satisfaction**: Enforcing joint limits and natural motion
- **Animation Parameters**: Real-time motion control and adaptation
- **Space Conversion**: Efficient coordinate space transformations

## Code Example
```wgsl
// Compute shader for two-bone IK (simplified)
@compute @workgroup_size(64)
fn solveTwoBoneIK(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    if (id.x >= numIKChains) {
        return;
    }
    
    let chainIndex = id.x;
    let chain = ikChains[chainIndex];
    
    // Get joint positions and target
    let rootPos = skeletonJointPositions[chain.rootJointIndex];
    let midPos = skeletonJointPositions[chain.midJointIndex];
    let endPos = skeletonJointPositions[chain.endJointIndex];
    let targetPos = ikTargets[chainIndex].position;
    
    // Calculate current bone lengths
    let bone1Length = distance(rootPos, midPos);
    let bone2Length = distance(midPos, endPos);
    let maxReach = bone1Length + bone2Length;
    
    // Calculate direction to target
    let rootToTarget = normalize(targetPos - rootPos);
    let distToTarget = distance(rootPos, targetPos);
    
    // Clamp target distance if beyond reach
    distToTarget = min(distToTarget, maxReach - 0.001);
    
    // Calculate joint positions using law of cosines
    let cos1 = (distToTarget * distToTarget + bone1Length * bone1Length - bone2Length * bone2Length) / 
               (2.0 * distToTarget * bone1Length);
    let cos1Clamped = clamp(cos1, -1.0, 1.0);
    let angle1 = acos(cos1Clamped);
    
    // Calculate mid joint position
    let rotAxis = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), rootToTarget));
    let midOffset = bone1Length * rotate(rootToTarget, rotAxis, angle1);
    let newMidPos = rootPos + midOffset;
    
    // Calculate end position
    let midToEnd = normalize(targetPos - newMidPos);
    let newEndPos = newMidPos + midToEnd * bone2Length;
    
    // Store new joint rotations (derived from positions)
    ikResults[chainIndex].midJointRotation = calculateJointRotation(rootPos, newMidPos, chain.midJointInitialRotation);
    ikResults[chainIndex].endJointRotation = calculateJointRotation(newMidPos, newEndPos, chain.endJointInitialRotation);
}
```

## JavaScript API
```javascript
// Create an IK system
const ikSystem = engine.animation.createIKSystem({
  solver: 'FABRIK', // 'TwoBone', 'FABRIK', 'CCD', 'Jacobian'
  iterations: 10,
  threshold: 0.001,
  dampening: 0.5
});

// Define an IK chain for a character
const legIK = character.animation.createIKChain({
  name: 'rightLeg',
  rootBone: 'rightThigh',
  midBone: 'rightShin',
  endBone: 'rightFoot',
  target: 'rightFootTarget',
  poleTarget: 'rightKneePole', // For directional control
  weight: 1.0,
  stretchLimit: 0.1,
  constraints: {
    rightThigh: { 
      hingeAxis: [0, 0, 1], 
      limits: [-45, 90] // Degrees
    },
    rightShin: { 
      hingeAxis: [0, 0, 1], 
      limits: [0, 160] // Degrees
    }
  }
});

// Create a procedural walk controller
const walkController = character.animation.createProcedural({
  type: 'locomotion',
  footPlacement: true,
  groundAdaptation: true,
  balancing: true,
  parameters: {
    walkSpeed: 2.0,
    turnSpeed: 120, // Degrees per second
    strideLength: 1.2,
    footHeight: 0.3,
    hipHeight: 0.9
  }
});

// Update procedural animation with gameplay inputs
engine.onUpdate((deltaTime) => {
  // Update walk parameters based on input
  const moveSpeed = controls.getMovementIntensity();
  walkController.setParameter('walkSpeed', moveSpeed * 3.0);
  walkController.setParameter('strideLength', 0.8 + moveSpeed * 0.6);
  
  // Set IK targets for foot placement
  if (moveSpeed > 0) {
    const footTargets = walkController.getFootTargets();
    legIK.setTargetPosition(footTargets.rightFoot);
    
    // Optional: adjust based on ground height
    const groundHeight = getGroundHeightAt(footTargets.rightFoot);
    legIK.setTargetPosition([
      footTargets.rightFoot[0],
      groundHeight,
      footTargets.rightFoot[2]
    ]);
  }
  
  // Update IK system
  ikSystem.update(deltaTime);
});
```

## Common Applications
- **Foot Placement**: Adaptive foot positioning on uneven terrain
- **Look-At Systems**: Dynamic head and eye targeting
- **Hand Interaction**: Procedural reaching, grabbing, and object manipulation
- **Balance Adjustment**: Realistic character stabilization
- **Environment Adaptation**: Character response to dynamic surroundings

## Integration with Keyframed Animation
- **Animation Layering**: Combining procedural and authored animation
- **Motion Matching**: Selecting and blending animations based on desired motion
- **Pose Correction**: Adjusting keyframed animation for context
- **Animation Amplification**: Enhancing basic animations with procedural details
- **Transition Generation**: Smoothly connecting disparate animation states

## Advanced Features
- **Crowd Animation Variation**: Applying subtle differences across multiple characters
- **Neural Networks**: Machine learning-powered animation generation
- **Emotional State Mapping**: Adapting movement based on character mental state
- **Physical Interaction Systems**: Generating appropriate responses to collisions
- **Cloth and Hair Simulation**: Secondary motion systems
