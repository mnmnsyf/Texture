window.GALLERY_DATA = {
  title: "Mesh Generation Gallery",
  subtitle: "Texture benchmark outputs collected from this repository.",
  updated: "2026-05-31",
  methods: [
    {
      id: "meshy",
      name: "Meshy",
      tag: "single mesh",
    },
    {
      id: "trellis2",
      name: "TRELLIS2",
      tag: "textured GLB",
    },
    {
      id: "materialmvp",
      name: "MaterialMVP",
      tag: "PBR texture",
    },
    {
      id: "hunyuan",
      name: "Hunyuan",
      tag: "OBJ texture",
    },
  ],
  cases: [
    {
      id: "bicycle",
      name: "Bicycle",
      category: "Object",
      input: {
        preview: "input_images/bicycle.jpg",
        mesh: "Test_Model/bicycle/raw_geometry.glb",
      },
      results: {
        meshy: {
          preview: "Meshy/bicycle.png",
          mesh: "Meshy/Meshy_Bicycle_texture.glb",
          partCount: 1,
          status: "ready",
        },
        trellis2: {
          preview: "TRELLIS2/TRELLIS2_bicycle.png",
          mesh: "TRELLIS2/bicycle/bicycle_trellis_textured.glb",
          partCount: 1,
          status: "ready",
        },
        materialmvp: {
          preview: "MaterialMVP/MVP_bicycle.png",
          mesh: "MaterialMVP/bicycle/bicycle_textured.glb",
          texture: "MaterialMVP/bicycle/bicycle_textured.jpg",
          partCount: 1,
          status: "ready",
        },
        hunyuan: {
          preview: "Hunyuan/Hunyuan_bicycle.png",
          mesh: "Hunyuan/bicycle_texture_test/bicycle_textured.obj",
          texture: "Hunyuan/bicycle_texture_test/bicycle_textured.jpg",
          partCount: 1,
          status: "ready",
        },
      },
    },
    {
      id: "scissors",
      name: "Scissors",
      category: "Tool",
      input: {
        preview: "input_images/scissors.jpg",
        mesh: "Test_Model/scissors/raw_geometry.glb",
      },
      results: {
        meshy: {
          preview: "Meshy/scissors.png",
          mesh: "Meshy/Meshy_scissors_texture.glb",
          partCount: 1,
          status: "ready",
        },
        trellis2: {
          preview: "TRELLIS2/TRELLIS2_scissors.png",
          mesh: "TRELLIS2/scissors/scissors_trellis_textured.glb",
          partCount: 1,
          status: "ready",
        },
        materialmvp: {
          preview: "MaterialMVP/MVP_scissors.png",
          mesh: "MaterialMVP/scissors/scissors_textured.glb",
          texture: "MaterialMVP/scissors/scissors_textured.jpg",
          partCount: 1,
          status: "ready",
        },
        hunyuan: {
          preview: "Hunyuan/Hunyuan_scissors.png",
          mesh: "Hunyuan/scissors_texture_test/scissors_textured.obj",
          texture: "Hunyuan/scissors_texture_test/scissors_textured.jpg",
          partCount: 1,
          status: "ready",
        },
      },
    },
    {
      id: "stitcher",
      name: "Stitcher",
      category: "Tool",
      input: {
        preview: "input_images/stitcher.jpg",
        mesh: "Test_Model/stitcher/raw_geometry.glb",
      },
      results: {
        meshy: {
          preview: "Meshy/stitcher.png",
          mesh: "Meshy/Meshy_stitcher_texture.glb",
          partCount: 1,
          status: "ready",
        },
        trellis2: {
          preview: "TRELLIS2/TRELLIS2_stitcher.png",
          mesh: "TRELLIS2/stitcher/stitcher_trellis_textured.glb",
          partCount: 1,
          status: "ready",
        },
        materialmvp: {
          preview: "MaterialMVP/MVP_stitcher.png",
          mesh: "MaterialMVP/stitcher/stitcher_textured.glb",
          texture: "MaterialMVP/stitcher/stitcher_textured.jpg",
          partCount: 1,
          status: "ready",
        },
        hunyuan: {
          preview: "Hunyuan/Hunyuan_stitcher.png",
          mesh: "Hunyuan/stitcher_texture_test/stitcher_textured.obj",
          texture: "Hunyuan/stitcher_texture_test/stitcher_textured.jpg",
          partCount: 1,
          status: "ready",
        },
      },
    },
    {
      id: "telescope",
      name: "Telescope",
      category: "Object",
      input: {
        preview: "input_images/telescope.png",
        mesh: "Test_Model/telescope/raw_geometry.glb",
      },
      results: {
        meshy: {
          preview: "Meshy/telescope.png",
          mesh: "Meshy/Meshy_telescope_texture.glb",
          partCount: 1,
          status: "ready",
        },
        trellis2: {
          preview: "TRELLIS2/TRELLIS2_telescope.png",
          mesh: "TRELLIS2/telescope/telescope_trellis_textured.glb",
          partCount: 1,
          status: "ready",
        },
        materialmvp: {
          preview: "MaterialMVP/MVP_telescope.png",
          mesh: "MaterialMVP/telescope/telescope_textured.glb",
          texture: "MaterialMVP/telescope/telescope_textured.jpg",
          partCount: 1,
          status: "ready",
        },
        hunyuan: {
          preview: "Hunyuan/Hunyuan_telescope.png",
          mesh: "Hunyuan/telescope_texture_test/telescope_textured.obj",
          texture: "Hunyuan/telescope_texture_test/telescope_textured.jpg",
          partCount: 1,
          status: "ready",
        },
      },
    },
    {
      id: "transformer",
      name: "Transformer",
      category: "Multipart",
      input: {
        preview: "input_images/transformer.png",
        mesh: "Test_Model/transformer/5/merged.glb",
      },
      results: {
        meshy: {
          preview: "Meshy/transformer.png",
          mesh: "Meshy/Meshy_Transforner_texture.glb",
          partCount: 1,
          status: "ready",
        },
        trellis2: {
          preview: "TRELLIS2/transformer_texturing/merged.png",
          mesh: "TRELLIS2/transformer_texturing/merged/transformer_merged_textured.glb",
          parts: "TRELLIS2/transformer_texturing/parts.png",
          partCount: 5,
          status: "ready",
        },
        materialmvp: {
          preview: "MaterialMVP/transformer_output/merged_output.png",
          mesh: "MaterialMVP/transformer_output/merged_output/merged_textured.glb",
          texture: "MaterialMVP/transformer_output/merged_output/merged_textured.jpg",
          partCount: 5,
          status: "ready",
        },
        hunyuan: {
          preview: "Hunyuan/transformer_texture_test/hunyuan_result.png",
          mesh: "Hunyuan/transformer_texture_test/transformer_textured.obj",
          texture: "Hunyuan/transformer_texture_test/transformer_textured.jpg",
          partCount: 1,
          status: "ready",
        },
      },
    },
  ],
};
