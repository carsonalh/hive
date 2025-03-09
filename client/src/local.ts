import { assert } from './assert'

interface Scene {
    program: WebGLProgram
    vao: WebGLVertexArrayObject
    vbo: {
        position: WebGLBuffer
        texCoord: WebGLBuffer
        normal: WebGLBuffer
        tangent: WebGLBuffer
        offset: WebGLBuffer
        foregroundColor: WebGLBuffer
        backgroundColor: WebGLBuffer
    }
    uniform: {
        projection: WebGLUniformLocation
        view: WebGLUniformLocation
        model: WebGLUniformLocation
        texture: WebGLUniformLocation
        normalMap: WebGLUniformLocation
        sunDirection: WebGLUniformLocation
        cameraDirection: WebGLUniformLocation
        ambientLight: WebGLUniformLocation
    }
    indices: WebGLBuffer
    indicesLength: number
}

let gl: WebGL2RenderingContext | null = null
let scene: Scene | null = null

export function setupLocalGameplay() {
    const canvas = document.querySelector('canvas')
    assert(canvas != null)
    gl = canvas.getContext('webgl2')
    assert(gl != null)
    // TODO some kind of loading screen
    const onResize = () => {
        assert(gl != null)
        const width = window.innerWidth
        const height = window.innerHeight
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
    }
    onResize()
    window.addEventListener('resize', onResize)

    loadScene()

    gl.enable(gl.DEPTH_TEST)

    let nextFrame = -1
    let lastFrame = 0
    const DEFAULT_FRAME_TIME_MS = 1000 / 60
    function animate(msSinceBegin: number) {
        let dt = DEFAULT_FRAME_TIME_MS
        if (lastFrame) {
            dt = msSinceBegin - lastFrame
        }
        lastFrame = msSinceBegin

        assert(gl != null)

        gl.clearColor(0.18, 0.14, 0.19, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        if (scene == null) {
            // TODO loading screen
        } else {
            const {
                program,
                uniform: {
                    model: modelUniform,
                    view: viewUniform,
                    projection: projectionUniform,
                },
                vao,
                indicesLength,
            } = scene

            gl.useProgram(program)

            const theta = msSinceBegin / 1000
            gl.uniformMatrix4fv(modelUniform, true, new Float32Array([
                Math.cos(theta), 0, Math.sin(theta), 0,
                0, 1, 0, 0,
                -Math.sin(theta), 0, Math.cos(theta), 0,
                0, 0, 0, 1,
                // 1, 0, 0, 0,
                // 0, 1, 0, 0,
                // 0, 0, 1, 0,
                // 0, 0, 0, 1,
            ]))
            const cameraMatrix = new Float32Array([
                1, 0, 0, 0,
                0, 0, 1, 5,
                0, -1, 0, 0,
                0, 0, 0, 1,
            ])
            invert4x4(cameraMatrix, cameraMatrix)
            gl.uniformMatrix4fv(viewUniform, true, cameraMatrix)
            gl.uniformMatrix4fv(projectionUniform, true, perspectiveMatrix(75 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100))

            gl.bindVertexArray(vao)
            gl.uniform1iv(scene.uniform.texture, new Int32Array([0, 1, 2, 3, 4, 5, 6]))
            gl.uniform1iv(scene.uniform.normalMap, new Int32Array([7, 8, 9, 10, 11, 12, 13]))
            gl.uniform3fv(scene.uniform.sunDirection, new Float32Array([1 / Math.sqrt(3), -1 / Math.sqrt(3), 1 / Math.sqrt(3)]))
            gl.uniform1f(scene.uniform.ambientLight, 0.25)
            gl.uniform3fv(scene.uniform.cameraDirection, new Float32Array([0, 1, 0]))
            gl.drawElementsInstanced(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0, 3)
        }

        nextFrame = window.requestAnimationFrame(animate)
    }
    nextFrame = window.requestAnimationFrame(animate)

    return () => {
        window.removeEventListener('resize', onResize)
        window.cancelAnimationFrame(nextFrame)
    }
}

/** Loads all of the necessary rendering data into the module-scoped 'scene' */
async function loadScene(): Promise<void> {
    assert(gl != null)

    const program = createProgram()

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    const normalLocation = gl.getAttribLocation(program, 'a_normal')
    const tangentLocation = gl.getAttribLocation(program, 'a_tangent')
    const offsetLocation = gl.getAttribLocation(program, 'a_offset')
    const pieceTypeLocation = gl.getAttribLocation(program, 'a_pieceType')
    const backgroundColorLocation = gl.getAttribLocation(program, 'a_backgroundColor')
    const foregroundColorLocation = gl.getAttribLocation(program, 'a_foregroundColor')

    assert(positionLocation !== -1)
    assert(texCoordLocation !== -1)
    assert(normalLocation !== -1)
    assert(offsetLocation !== -1)
    assert(pieceTypeLocation !== -1)
    assert(backgroundColorLocation !== -1)
    assert(foregroundColorLocation !== -1)

    let positionBuffer: WebGLBuffer | null = null
    let texCoordBuffer: WebGLBuffer | null = null
    let normalBuffer: WebGLBuffer | null = null
    let tangentBuffer: WebGLBuffer | null = null
    let offsetBuffer: WebGLBuffer | null = null
    let pieceTypeBuffer: WebGLBuffer | null = null
    let backgroundColorBuffer: WebGLBuffer | null = null
    let foregroundColorBuffer: WebGLBuffer | null = null

    let indexBuffer: WebGLBuffer | null = null

    let tileVao: WebGLVertexArrayObject | null = null
    let tileIndicesLength = -1
    // let tileIndicesType = gl.UNSIGNED_SHORT
    // let tileArrayBuffer = null
    let coordBuffer: WebGLBuffer | null = null
    const fetchTile = fetch('/res/tile.glb', { mode: 'same-origin', cache: 'force-cache' })
        .then(async response => {
            const arrayBuffer = await response.arrayBuffer()
            const {
                positionArray,
                texCoordArray,
                normalArray,
                indicesArray,
            } = loadGltf(arrayBuffer)

            assert(gl != null)

            const vertexArray = gl.createVertexArray()
            gl.bindVertexArray(vertexArray)

            positionBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW)
            gl.enableVertexAttribArray(positionLocation)
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
            texCoordBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW)
            gl.enableVertexAttribArray(texCoordLocation)
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)
            normalBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW)
            gl.enableVertexAttribArray(normalLocation)
            gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)
            indexBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesArray, gl.STATIC_DRAW)

            const tangentArray = calculateTangents(positionArray, normalArray, texCoordArray, indicesArray)

            tangentBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, tangentArray, gl.STATIC_DRAW)
            gl.enableVertexAttribArray(tangentLocation)
            gl.vertexAttribPointer(tangentLocation, 3, gl.FLOAT, false, 0, 0)

            // We could even just preallocate the offset buffer here for future use
            offsetBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer)
            const pos0 = axialToCartesian({ q: -1, r: 0 })
            const pos1 = axialToCartesian({ q: 0, r: 0 })
            const pos2 = axialToCartesian({ q: 1, r: -1 })
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos0.x, 0, pos0.y, pos1.x, 0, pos1.y, pos2.x, 0, -pos2.y]), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(offsetLocation)
            gl.vertexAttribPointer(offsetLocation, 3, gl.FLOAT, false, 0, 0)
            gl.vertexAttribDivisor(offsetLocation, 1)
            coordBuffer = offsetBuffer

            pieceTypeBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, pieceTypeBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array([0, 1, 2]), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(pieceTypeLocation)
            gl.vertexAttribIPointer(pieceTypeLocation, 1, gl.UNSIGNED_INT, 0, 0)
            gl.vertexAttribDivisor(pieceTypeLocation, 1)

            backgroundColorBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, backgroundColorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                1, 1, 1,
                0, 1, 0,
                0, 0, 1,
            ]), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(backgroundColorLocation)
            gl.vertexAttribPointer(backgroundColorLocation, 3, gl.FLOAT, false, 0, 0)
            gl.vertexAttribDivisor(backgroundColorLocation, 1)

            foregroundColorBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, foregroundColorBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                0, 0, 0,
                1, 0, 1,
                0, 1, 1,
            ]), gl.STATIC_DRAW)
            gl.enableVertexAttribArray(foregroundColorLocation)
            gl.vertexAttribPointer(foregroundColorLocation, 3, gl.FLOAT, false, 0, 0)
            gl.vertexAttribDivisor(foregroundColorLocation, 1)

            tileIndicesLength = indicesArray.length
            tileVao = vertexArray
        })

    const queenBeeTexture = gl.createTexture()
    const soldierAntTexture = gl.createTexture()
    const grasshopperTexture = gl.createTexture()
    const spiderTexture = gl.createTexture()
    const beetleTexture = gl.createTexture()
    const ladybugTexture = gl.createTexture()
    const mosquitoTexture = gl.createTexture()
    const loadImage = (path: string, texture: WebGLTexture, slot: number) => new Promise(resolve => {
        const image = new Image(1024, 1024)
        image.src = path
        image.addEventListener('load', () => {
            assert(gl != null)
            gl.activeTexture(gl.TEXTURE0 + slot)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, image)
            gl.generateMipmap(gl.TEXTURE_2D)
            resolve(null)
        })
    })
    const loadQueenBeeImage = loadImage('/res/queenbee.svg', queenBeeTexture, 0)
    const loadSoldierAntImage = loadImage('/res/soldierant.svg', soldierAntTexture, 1)
    const loadGrasshopperImage = loadImage('/res/grasshopper.svg', grasshopperTexture, 2)
    const loadSpiderImage = loadImage('/res/spider.svg', spiderTexture, 3)
    const loadBeetleImage = loadImage('/res/beetle.svg', beetleTexture, 4)
    const loadLadybugImage = loadImage('/res/ladybug.svg', ladybugTexture, 5)
    const loadMosquitoImage = loadImage('/res/mosquito.svg', mosquitoTexture, 6)

    const queenBeeNormalMap = gl.createTexture()
    const soldierAntNormalMap = gl.createTexture()
    const grasshopperNormalMap = gl.createTexture()
    const spiderNormalMap = gl.createTexture()
    const beetleNormalMap = gl.createTexture()
    const ladybugNormalMap = gl.createTexture()
    const mosquitoNormalMap = gl.createTexture()
    const loadNormalMap = (path: string, texture: WebGLTexture, slot: number) => new Promise(resolve => {
        const image = new Image(512, 512)
        image.src = path
        image.addEventListener('load', () => {
            assert(gl != null)
            gl.activeTexture(gl.TEXTURE0 + slot)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, image)
            gl.generateMipmap(gl.TEXTURE_2D)
            resolve(image)
        })
    })
    const loadQueenBeeNormalMap = loadNormalMap('/res/queenbee_normal.jpg', queenBeeNormalMap, 7)
    const loadSoldierAntNormalMap = loadNormalMap('/res/soldierant_normal.jpg', soldierAntNormalMap, 8)
    const loadGrasshopperNormalMap = loadNormalMap('/res/grasshopper_normal.jpg', grasshopperNormalMap, 9)
    const loadSpiderNormalMap = loadNormalMap('/res/spider_normal.jpg', spiderNormalMap, 10)
    const loadBeetleNormalMap = loadNormalMap('/res/beetle_normal.jpg', beetleNormalMap, 11)
    const loadLadybugNormalMap = loadNormalMap('/res/ladybug_normal.jpg', ladybugNormalMap, 12)
    const loadMosquitoNormalMap = loadNormalMap('/res/mosquito_normal.jpg', mosquitoNormalMap, 13)

    const projectionLocation = gl.getUniformLocation(program, 'u_projection')
    const viewLocation = gl.getUniformLocation(program, 'u_view')
    const modelLocation = gl.getUniformLocation(program, 'u_model')
    const textureLocation = gl.getUniformLocation(program, 'u_texture')
    const normalMapLocation = gl.getUniformLocation(program, 'u_normalMap')
    const sunDirectionLocation = gl.getUniformLocation(program, 'u_sunDirection')
    const cameraDirectionLocation = gl.getUniformLocation(program, 'u_cameraDirection')
    const ambientLightLocation = gl.getUniformLocation(program, 'u_ambientLight')

    assert(projectionLocation != null)
    assert(viewLocation != null)
    assert(modelLocation != null)
    assert(textureLocation != null)
    assert(normalMapLocation != null)
    assert(sunDirectionLocation != null)
    assert(cameraDirectionLocation != null)
    assert(ambientLightLocation != null)

    await Promise.all([
        loadQueenBeeImage,
        loadSoldierAntImage,
        loadGrasshopperImage,
        loadSpiderImage,
        loadBeetleImage,
        loadLadybugImage,
        loadMosquitoImage,
        loadQueenBeeNormalMap,
        loadSoldierAntNormalMap,
        loadGrasshopperNormalMap,
        loadSpiderNormalMap,
        loadBeetleNormalMap,
        loadLadybugNormalMap,
        loadMosquitoNormalMap,
        fetchTile,
    ])

    assert(positionBuffer != null)
    assert(texCoordBuffer != null)
    assert(normalBuffer != null)
    assert(tangentBuffer != null)
    assert(offsetBuffer != null)
    assert(indexBuffer != null)
    assert(foregroundColorBuffer != null)
    assert(backgroundColorBuffer != null)

    assert(tileVao != null)

    scene = {
        program,
        vao: tileVao,
        vbo: {
            position: positionBuffer,
            texCoord: texCoordBuffer,
            normal: normalBuffer,
            tangent: tangentBuffer,
            offset: offsetBuffer,
            foregroundColor: foregroundColorBuffer,
            backgroundColor: backgroundColorBuffer,
        },
        uniform: {
            projection: projectionLocation,
            view: viewLocation,
            model: modelLocation,
            texture: textureLocation,
            normalMap: normalMapLocation,
            sunDirection: sunDirectionLocation,
            cameraDirection: cameraDirectionLocation,
            ambientLight: ambientLightLocation,
        },
        indices: indexBuffer,
        indicesLength: tileIndicesLength,
    }
    // Load the tile and all the images, caching where possible
    // await Promise.all on what we have just loaded
}

function createProgram(): WebGLProgram {
    assert(gl != null)
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    assert(vertexShader != null)
    gl.shaderSource(vertexShader, `#version 300 es
in vec3 a_position;
in vec2 a_texCoord;
in vec3 a_normal;
in vec3 a_tangent;
in vec3 a_offset;
in uint a_pieceType;
in vec3 a_backgroundColor;
in vec3 a_foregroundColor;

out vec3 v_position;
out vec2 v_texCoord;
out vec3 v_normal;
out vec3 v_tangent;
flat out uint v_pieceType;
out vec3 v_backgroundColor;
out vec3 v_foregroundColor;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_model;

void main()
{
    v_position = (u_model * vec4(a_position, 1.0)).xyz + a_offset;
    v_texCoord = a_texCoord;
    v_normal = normalize(mat3(u_model) * a_normal);
    v_tangent = normalize(mat3(u_model) * a_tangent);
    v_pieceType = a_pieceType;
    v_backgroundColor = a_backgroundColor;
    v_foregroundColor = a_foregroundColor;
    vec4 pre_offset = u_model * vec4(a_position, 1.0);
    vec4 post_offset = vec4(a_offset, 0.0) + pre_offset;
    gl_Position = u_projection * u_view * post_offset;
}
`)
    gl.compileShader(vertexShader)
    assert(
        gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS),
        `Error compiling vertex shader:\n${gl.getShaderInfoLog(vertexShader)}`
    )

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    assert(fragmentShader != null)
    gl.shaderSource(fragmentShader, `#version 300 es
precision highp float;
in highp vec3 v_position;
in highp vec2 v_texCoord;
in highp vec3 v_normal;
in highp vec3 v_tangent;
flat in uint v_pieceType;
in highp vec3 v_backgroundColor;
in highp vec3 v_foregroundColor;

out highp vec4 f_color;

uniform sampler2D u_texture[7];
uniform sampler2D u_normalMap[7];
uniform highp vec3 u_sunDirection;
uniform highp vec3 u_cameraDirection;
uniform highp float u_ambientLight;

void main()
{
    vec3 n = normalize(v_normal);
    vec3 t = normalize(v_tangent - dot(v_tangent, v_normal) * v_normal);
    vec3 b = cross(n, t);
    mat3 tbn = mat3(t, b, n);
    vec4 textureValue;
    switch (v_pieceType) {
    case 0u: textureValue = texture(u_normalMap[0], v_texCoord); break;
    case 1u: textureValue = texture(u_normalMap[1], v_texCoord); break;
    case 2u: textureValue = texture(u_normalMap[2], v_texCoord); break;
    case 3u: textureValue = texture(u_normalMap[3], v_texCoord); break;
    case 4u: textureValue = texture(u_normalMap[4], v_texCoord); break;
    case 5u: textureValue = texture(u_normalMap[5], v_texCoord); break;
    case 6u: textureValue = texture(u_normalMap[6], v_texCoord); break;
    }
    vec3 new_normal = tbn * normalize(vec3(2.0 * textureValue - 1.0) + vec3(0.0, 0.0, 0.5));

    vec3 reflection = reflect(u_sunDirection, new_normal);
    float specular = dot(reflection, u_cameraDirection);
    // make it zero or positive
    specular = specular * (sign(specular) + 1.0) / 2.0;
    specular = pow(specular, 12.0);
    float diffuse = dot(-u_sunDirection, new_normal);
    diffuse = max(diffuse, u_ambientLight);
    switch (v_pieceType) {
    case 0u: textureValue = texture(u_texture[0], v_texCoord); break;
    case 1u: textureValue = texture(u_texture[1], v_texCoord); break;
    case 2u: textureValue = texture(u_texture[2], v_texCoord); break;
    case 3u: textureValue = texture(u_texture[3], v_texCoord); break;
    case 4u: textureValue = texture(u_texture[4], v_texCoord); break;
    case 5u: textureValue = texture(u_texture[5], v_texCoord); break;
    case 6u: textureValue = texture(u_texture[6], v_texCoord); break;
    }
    float color_indicator = textureValue.r;
    vec3 base_color = color_indicator * v_foregroundColor + (1.0 - color_indicator) * v_backgroundColor;
    f_color = vec4(base_color * diffuse + vec3(specular), 1.0) + vec4(float(v_pieceType) * .0001);
}
`)
    gl.compileShader(fragmentShader)
    assert(
        gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS),
        `Error compiling fragment shader:\n${gl.getShaderInfoLog(fragmentShader)}`
    )

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    assert(
        gl.getProgramParameter(program, gl.LINK_STATUS),
        `Error linking the program:\n${gl.getProgramInfoLog(program)}`
    )

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
}

/**
 * Looks in the negative z direction.
 */
function perspectiveMatrix(fov: number, aspect: number, near: number, far: number) {
    assert(fov > 0)
    assert(aspect !== 0)

    return new Float32Array([
        (1 / Math.tan(0.5 * fov)) / aspect, 0, 0, 0,
        0, 1 / Math.tan(0.5 * fov), 0, 0,
        0, 0, -far / (far - near), -far * near / (far - near),
        0, 0, -1, 0,
    ])
}

/**
 * This loader is _not_ meant to be a general-purpose gltf loader.
 * It simply loads a model that is in the format we need for this game, and
 * errors otherwise.
 */
function loadGltf(arrayBuffer: ArrayBuffer) {
    const view = new DataView(arrayBuffer)
    const magic = view.getUint32(0, true)
    const version = view.getUint32(4, true)
    const length = view.getUint32(8, true)

    assert(magic == 0x46546c67, 'not a valid .glb file')
    assert(version == 2, 'can only parse glTF version 2')
    assert(length == arrayBuffer.byteLength, 'corrupted glTF file; byte length != length of array buffer')

    const chunk0Length = view.getUint32(12, true)
    const chunk0Type = view.getUint32(16, true)
    assert(chunk0Type == 0x4E4F534A, 'expect json chunk to be first')
    assert(12 + chunk0Length < arrayBuffer.byteLength)

    const chunk1Length = view.getUint32(12 + 8 + chunk0Length, true)
    const chunk1Type = view.getUint32(12 + 8 + chunk0Length + 4, true)
    assert(chunk1Type == 0x004E4942, 'expected to find a binary chunk as the second')
    assert(12 + 8 + chunk0Length + 8 + chunk1Length == arrayBuffer.byteLength)

    const decoder = new TextDecoder('utf-8')
    const jsonArray = new Uint8Array(arrayBuffer, 20, chunk0Length)
    const jsonMetadata = decoder.decode(jsonArray)
    const metadata = JSON.parse(jsonMetadata)

    assert(metadata.meshes.length === 1)
    const primitives = metadata.meshes[0].primitives[0]
    const positionAccessor = metadata.accessors[primitives.attributes.POSITION]
    assert(positionAccessor.type === 'VEC3'
        && positionAccessor.componentType === WebGLRenderingContext.FLOAT)
    const texCoordAccessor = metadata.accessors[primitives.attributes.TEXCOORD_0]
    assert(texCoordAccessor.type === 'VEC2'
        && texCoordAccessor.componentType === WebGLRenderingContext.FLOAT)
    const normalAccessor = metadata.accessors[primitives.attributes.NORMAL]
    assert(normalAccessor.type === 'VEC3'
        && normalAccessor.componentType === WebGLRenderingContext.FLOAT)
    const indicesAccessor = metadata.accessors[primitives.indices]
    assert(indicesAccessor.type === 'SCALAR'
        && indicesAccessor.componentType === WebGLRenderingContext.UNSIGNED_SHORT)

    const positionBufferView = metadata.bufferViews[primitives.attributes.POSITION]
    const texCoordBufferView = metadata.bufferViews[primitives.attributes.TEXCOORD_0]
    const normalBufferView = metadata.bufferViews[primitives.attributes.NORMAL]
    const indicesBufferView = metadata.bufferViews[primitives.indices]
    assert(positionBufferView.buffer == 0)
    assert(texCoordBufferView.buffer == 0)
    assert(normalBufferView.buffer == 0)
    assert(indicesBufferView.buffer == 0)

    const positionArray = new Float32Array(
        arrayBuffer,
        12 + 8 + chunk0Length + 8 + positionBufferView.byteOffset,
        positionBufferView.byteLength / 4
    )
    const texCoordArray = new Float32Array(
        arrayBuffer,
        12 + 8 + chunk0Length + 8 + texCoordBufferView.byteOffset,
        texCoordBufferView.byteLength / 4
    )
    const normalArray = new Float32Array(
        arrayBuffer,
        12 + 8 + chunk0Length + 8 + normalBufferView.byteOffset,
        normalBufferView.byteLength / 4
    )
    const indicesArray = new Uint16Array(
        arrayBuffer,
        12 + 8 + chunk0Length + 8 + indicesBufferView.byteOffset,
        indicesBufferView.byteLength / 2
    )

    return {
        positionArray,
        texCoordArray,
        normalArray,
        indicesArray,
    }
}

function calculateTangents(positions: Float32Array, normals: Float32Array, textureCoords: Float32Array, indices: Uint16Array): Float32Array {
    // For each vertex, calculate the mesh tangents aligned to point in
    // the positive u direction (transformed to 3D Euclidean)

    // We take the average of each of these tangents (only because we
    // are using meshes with smooth shading, otherwise this would have
    // to be done per-face), and project this into the subspace of
    // orthogonal vectors to the normal

    assert(indices.length % 3 === 0)

    const tangents: Map<number, Float32Array[]> = new Map()

    for (let i = 0; i < indices.length; i += 3) {
        const index0 = indices[i + 0]
        const index1 = indices[i + 1]
        const index2 = indices[i + 2]

        // 3d positions of this face
        const x0 = positions.slice(3 * index0, 3 * index0 + 3)
        const x1 = positions.slice(3 * index1, 3 * index1 + 3)
        const x2 = positions.slice(3 * index2, 3 * index2 + 3)

        const xa = x1.map((x, i) => x - x0[i])
        const xb = x2.map((x, i) => x - x0[i])

        // 2d uvs of this face
        const u0 = textureCoords.slice(2 * index0, 2 * index0 + 2)
        const u1 = textureCoords.slice(2 * index1, 2 * index1 + 2)
        const u2 = textureCoords.slice(2 * index2, 2 * index2 + 2)

        const ua = u1.map((u, i) => u - u0[i])
        const ub = u2.map((u, i) => u - u0[i])

        // We have that
        //   U M = X
        // Where U is the matrix with ua as the first row and ub as the
        // second, and
        // X is the matrix with xa as the first row and xb as the
        // second, and
        // M is the matrix with the tangent as the first row and the
        // bitangent as the second
        //
        // Therefore,
        //   M = U^-1 X

        // The intuition to construct this comes from that from the
        // point x0, we can 'get' to x1 or x2 in object space (with the
        // vectors x1 - x0 and x2 - x0 respectively), or in uv space
        // with (u1 - u0) M and (u2 - u0) M respectively, where M is a
        // 2x3 matrix converting uv space to object space. It would
        // follow that the first and second rows of this matrix are the
        // tangents (in the direction [1, 0] in uv space) and bitangents
        // of a vertex

        const umat = new Float32Array([...ua, ...ub])
        const xmat = new Float32Array([...xa, ...xb])
        const uinv = new Float32Array(4)
        const out = new Float32Array(6)
        invert2x2(uinv, umat)
        multiply2x2_2x3(out, uinv, xmat)

        // per-face tangent
        const t = out.slice(0, 3)

        for (let j = 0; j < 3; j++) {
            if (tangents.has(indices[i + j])) {
                tangents.get(indices[i + j])!.push(t)
            } else {
                tangents.set(indices[i + j], [t])
            }
        }
    }

    const vertexTangents: Map<number, Float32Array> = new Map()

    for (const [index, faceTangents] of tangents.entries()) {
        const length = faceTangents.length
        const mean = faceTangents.reduce(
            (a, b) => a.map((x, i) => (x + b[i]) / length),
            new Float32Array(3)
        )
        const normal = normals.slice(3 * index, 3 * index + 3)
        // projection to be orthogonal with the vertex normal
        const dot = normal.map((x, i) => x * mean[i]).reduce((a, b) => a + b, 0)
        const normalComponent = normal.map(x => x * dot)
        const projected = mean.map((x, i) => x - normalComponent[i])
        const projectedNorm = Math.sqrt(projected.map(x => x * x).reduce((a, b) => a + b, 0))
        const normalized = projected.map(x => x / projectedNorm)
        vertexTangents.set(index, normalized)
    }

    // validate that what we have will work as a vao
    for (let i = 0; i < vertexTangents.size; i++) {
        assert(vertexTangents.has(i))
        const normSquared = vertexTangents.get(i)!.map(x => x * x).reduce((a, b) => a + b, 0)
        assert(Math.abs(normSquared - 1.0) < 1e-6)
        const normal = normals.slice(3 * i, 3 * i + 3)
        const tangentDotNormal = vertexTangents.get(i)!.map((x, i) => x * normal[i]).reduce((a, b) => a + b, 0)
        assert(Math.abs(tangentDotNormal) < 1e-6)
    }

    const tangentArray = new Float32Array(3 * vertexTangents.size)
    for (let i = 0; i < vertexTangents.size; i++) {
        tangentArray.set(vertexTangents.get(i)!, 3 * i)
    }

    return tangentArray
}

const TILE_INNER_RADIUS = 0.8
const TILE_PLACEMENT_GAP = 0.25

function axialToCartesian({ q, r }: { q: number, r: number }) {
    assert(Number.isInteger(q))
    assert(Number.isInteger(r))

    const tileScale = 2 * TILE_INNER_RADIUS + TILE_PLACEMENT_GAP

    return {
        x: (q + 0.5 * r) * tileScale,
        y: -Math.sqrt(3) / 2 * r * tileScale,
    }
}

type MutableArrayLike<T> = { length: number, [key: number]: T }

/**
 * Implementation copied from gl-matrix
 * https://github.com/toji/gl-matrix.git
 */
function invert4x4(src: ArrayLike<number>, dst: MutableArrayLike<number>) {
    assert(src.length === 16)
    assert(dst.length === 16)

    let a00 = src[0]
    let a01 = src[1]
    let a02 = src[2]
    let a03 = src[3]
    let a10 = src[4]
    let a11 = src[5]
    let a12 = src[6]
    let a13 = src[7]
    let a20 = src[8]
    let a21 = src[9]
    let a22 = src[10]
    let a23 = src[11]
    let a30 = src[12]
    let a31 = src[13]
    let a32 = src[14]
    let a33 = src[15]

    let b00 = a00 * a11 - a01 * a10
    let b01 = a00 * a12 - a02 * a10
    let b02 = a00 * a13 - a03 * a10
    let b03 = a01 * a12 - a02 * a11
    let b04 = a01 * a13 - a03 * a11
    let b05 = a02 * a13 - a03 * a12
    let b06 = a20 * a31 - a21 * a30
    let b07 = a20 * a32 - a22 * a30
    let b08 = a20 * a33 - a23 * a30
    let b09 = a21 * a32 - a22 * a31
    let b10 = a21 * a33 - a23 * a31
    let b11 = a22 * a33 - a23 * a32

    // Calculate the determinant
    let det =
        b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

    assert(!!det, "cannot invert a singular matrix")
    det = 1.0 / det

    dst[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
    dst[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det
    dst[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det
    dst[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det
    dst[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det
    dst[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det
    dst[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det
    dst[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det
    dst[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det
    dst[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det
    dst[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det
    dst[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det
    dst[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det
    dst[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det
    dst[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det
    dst[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det
}

export function invert2x2(dst: MutableArrayLike<number>, src: ArrayLike<number>) {
    assert(dst.length === 4)
    assert(src.length === 4)
    let a0 = src[0]
    let a1 = src[1]
    let a2 = src[2]
    let a3 = src[3]

    // Calculate the determinant
    let det = a0 * a3 - a2 * a1

    assert(!!det, "cannot invert a singular matrix")
    det = 1.0 / det

    dst[0] = a3 * det
    dst[1] = -a1 * det
    dst[2] = -a2 * det
    dst[3] = a0 * det

    return dst
}

export function multiply2x2_2x3(dst_2x3: MutableArrayLike<number>, _2x2: ArrayLike<number>, _2x3: ArrayLike<number>) {
    assert(dst_2x3.length === 6)
    assert(_2x2.length === 4)
    assert(_2x3.length === 6)

    const a00 = _2x2[0]
    const a01 = _2x2[1]
    const a10 = _2x2[2]
    const a11 = _2x2[3]

    const b00 = _2x3[0]
    const b01 = _2x3[1]
    const b02 = _2x3[2]
    const b10 = _2x3[3]
    const b11 = _2x3[4]
    const b12 = _2x3[5]

    dst_2x3[0] = a00 * b00 + a01 * b10
    dst_2x3[1] = a00 * b01 + a01 * b11
    dst_2x3[2] = a00 * b02 + a01 * b12
    dst_2x3[3] = a10 * b00 + a11 * b10
    dst_2x3[4] = a10 * b01 + a11 * b11
    dst_2x3[5] = a10 * b02 + a11 * b12

    return dst_2x3
}

