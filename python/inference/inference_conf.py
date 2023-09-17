from inference.api_models import StemmingModel
from inference.uvr.constants import DEMUCS_ARCH_TYPE, MDX_ARCH_TYPE, VR_ARCH_TYPE

vr_model_list = {
    # "1_HP-UVR": "1_HP-UVR.pth",
    # "2_HP-UVR": "2_HP-UVR.pth",
    # "3_HP-Vocal-UVR": "3_HP-Vocal-UVR.pth",
    # "4_HP-Vocal-UVR": "4_HP-Vocal-UVR.pth",
    "5_HP-Karaoke-UVR": "5_HP-Karaoke-UVR.pth",
    "6_HP-Karaoke-UVR": "6_HP-Karaoke-UVR.pth",
    # "7_HP2-UVR": "7_HP2-UVR.pth",
    # "8_HP2-UVR": "8_HP2-UVR.pth",
    # "9_HP2-UVR": "9_HP2-UVR.pth",
    # "10_SP-UVR-2B-32000-1": "10_SP-UVR-2B-32000-1.pth",
    # "11_SP-UVR-2B-32000-2": "11_SP-UVR-2B-32000-2.pth",
    # "12_SP-UVR-3B-44100": "12_SP-UVR-3B-44100.pth",
    # "13_SP-UVR-4B-44100-1": "13_SP-UVR-4B-44100-1.pth",
    # "14_SP-UVR-4B-44100-2": "14_SP-UVR-4B-44100-2.pth",
    # "15_SP-UVR-MID-44100-1": "15_SP-UVR-MID-44100-1.pth",
    # "16_SP-UVR-MID-44100-2": "16_SP-UVR-MID-44100-2.pth",
    # "17_HP-Wind_Inst-UVR": "17_HP-Wind_Inst-UVR.pth",
    # "UVR-De-Echo-Aggressive by FoxJoy": "UVR-De-Echo-Aggressive.pth",
    # "UVR-De-Echo-Normal by FoxJoy": "UVR-De-Echo-Normal.pth",
    "UVR-DeEcho-DeReverb by FoxJoy": "UVR-DeEcho-DeReverb.pth",
    # "UVR-DeNoise-Lite by FoxJoy": "UVR-DeNoise-Lite.pth",
    # "UVR-DeNoise by FoxJoy": "UVR-DeNoise.pth",
    # "MGM_HIGHEND_v4": "MGM_HIGHEND_v4.pth",
    # "MGM_LOWEND_A_v4": "MGM_LOWEND_A_v4.pth",
    # "MGM_LOWEND_B_v4": "MGM_LOWEND_B_v4.pth",
    # "MGM_MAIN_v4": "MGM_MAIN_v4.pth",
}
mdx_model_list = {
    "UVR-MDX-NET Voc FT": "UVR-MDX-NET-Voc_FT.onnx",
    # "Reverb HQ By FoxJoy": "Reverb_HQ_By_FoxJoy.onnx",
    # "UVR-MDX-NET Main": "UVR_MDXNET_Main.onnx",
    # "UVR-MDX-NET_Main_340": "UVR-MDX-NET_Main_340.onnx",
    # "UVR-MDX-NET_Main_390": "UVR-MDX-NET_Main_390.onnx",
    # "UVR-MDX-NET_Main_406": "UVR-MDX-NET_Main_406.onnx",
    # "UVR-MDX-NET_Main_427": "UVR-MDX-NET_Main_427.onnx",
    # "UVR-MDX-NET_Main_438": "UVR-MDX-NET_Main_438.onnx",
    # "UVR-MDX-NET_Inst_82_beta": "UVR-MDX-NET_Inst_82_beta.onnx",
    # "UVR-MDX-NET_Inst_90_beta": "UVR-MDX-NET_Inst_90_beta.onnx",
    # "UVR-MDX-NET_Inst_187_beta": "UVR-MDX-NET_Inst_187_beta.onnx",
    # "UVR-MDX-NET-Inst_full_292": "UVR-MDX-NET-Inst_full_292.onnx",
    # "UVR-MDX-NET Inst HQ 1": "UVR-MDX-NET-Inst_HQ_1.onnx",
    # "UVR-MDX-NET Inst HQ 2": "UVR-MDX-NET-Inst_HQ_2.onnx",
    # "UVR-MDX-NET Inst HQ 3": "UVR-MDX-NET-Inst_HQ_3.onnx",
    # "UVR-MDX-NET Inst Main": "UVR-MDX-NET-Inst_Main.onnx",
    # "UVR-MDX-NET 1": "UVR_MDXNET_1_9703.onnx",
    # "UVR-MDX-NET 2": "UVR_MDXNET_2_9682.onnx",
    # "UVR-MDX-NET 3": "UVR_MDXNET_3_9662.onnx",
    # "UVR-MDX-NET Inst 1": "UVR-MDX-NET-Inst_1.onnx",
    # "UVR-MDX-NET Inst 2": "UVR-MDX-NET-Inst_2.onnx",
    # "UVR-MDX-NET Inst 3": "UVR-MDX-NET-Inst_3.onnx",
    "UVR-MDX-NET Karaoke": "UVR_MDXNET_KARA.onnx",
    "UVR-MDX-NET Karaoke 2": "UVR_MDXNET_KARA_2.onnx",
    "UVR_MDXNET_9482": "UVR_MDXNET_9482.onnx",
    # "Kim Vocal 1": "Kim_Vocal_1.onnx",
    # "Kim Vocal 2": "Kim_Vocal_2.onnx",
    # "Kim Inst": "Kim_Inst.onnx",
    # "kuielab_a_vocals": "kuielab_a_vocals.onnx",
    # "kuielab_a_other": "kuielab_a_other.onnx",
    # "kuielab_a_bass": "kuielab_a_bass.onnx",
    # "kuielab_a_drums": "kuielab_a_drums.onnx",
    # "kuielab_b_vocals": "kuielab_b_vocals.onnx",
    # "kuielab_b_other": "kuielab_b_other.onnx",
    # "kuielab_b_bass": "kuielab_b_bass.onnx",
    # "kuielab_b_drums": "kuielab_b_drums.onnx",
}
demucs_model_list = {
    "v4 | htdemucs_ft": [
        "f7e0c4bc-ba3fe64a.th",
        "d12395a8-e57c48e6.th",
        "92cfc3b6-ef3bcb9c.th",
        "04573f0d-f3cf25b2.th",
        "htdemucs_ft.yaml",
    ],
    "v4 | htdemucs": ["955717e8-8726e21a.th", "htdemucs.yaml"],
    # "v4 | hdemucs_mmi": ["75fc33f5-1941ce65.th", "hdemucs_mmi.yaml"],
    # "v4 | htdemucs_6s": ["5c90dfd2-34c22ccb.th", "htdemucs_6s.yaml"],
    # "v3 | mdx": [
    #     "0d19c1c6-0f06f20e.th",
    #     "7ecf8ec1-70f50cc9.th",
    #     "c511e2ab-fe698775.th",
    #     "7d865c68-3d5dd56b.th",
    #     "mdx.yaml",
    # ],
    # "v3 | mdx_extra": [
    #     "e51eebcc-c1b80bdd.th",
    #     "a1d90b5c-ae9d2452.th",
    #     "5d2d6c55-db83574e.th",
    #     "cfa93e08-61801ae1.th",
    #     "mdx_extra.yaml",
    # ],
    # "v3 | mdx_extra_q": [
    #     "83fc094f-4a16d450.th",
    #     "464b36d7-e5a9386e.th",
    #     "14fc6a69-a89dd0ee.th",
    #     "7fd6ef75-a905dd85.th",
    #     "mdx_extra_q.yaml",
    # ],
    # "v3 | mdx_q": [
    #     "6b9c2ca1-3fd82607.th",
    #     "b72baf4e-8778635e.th",
    #     "42e558d4-196e0e1b.th",
    #     "305bc58f-18378783.th",
    #     "mdx_q.yaml",
    # ],
    # "v3 | repro_mdx_a": [
    #     "9a6b4851-03af0aa6.th",
    #     "1ef250f1-592467ce.th",
    #     "fa0cb7f9-100d8bf4.th",
    #     "902315c2-b39ce9c9.th",
    #     "repro_mdx_a.yaml",
    # ],
    # "v3 | repro_mdx_a_hybrid": [
    #     "fa0cb7f9-100d8bf4.th",
    #     "902315c2-b39ce9c9.th",
    #     "repro_mdx_a_hybrid_only.yaml",
    # ],
    # "v3 | repro_mdx_a_time": ["9a6b4851-03af0aa6.th", "1ef250f1-592467ce.th", "repro_mdx_a_time_only.yaml"],
    # "v3 | UVR_Model_1": ["ebf34a2db.th", "UVR_Demucs_Model_1.yaml"],
    # "v2 | Demucs": ["demucs-e07c671f.th"],
    # "v2 | Demucs_extra": ["demucs_extra-3646af93.th"],
    # "v2 | Demucs48_hq": ["demucs48_hq-28a1282c.th"],
    # "v2 | Tasnet": ["tasnet-beb46fac.th"],
    # "v2 | Tasnet_extra": ["tasnet_extra-df3777b2.th"],
    # "v2 | Demucs_unittest": ["demucs_unittest-09ebc15f.th"],
    # "v1 | Demucs": ["demucs.th"],
    # "v1 | Demucs_extra": ["demucs_extra.th"],
    # "v1 | Light": ["light.th"],
    # "v1 | Light_extra": ["light_extra.th"],
    # "v1 | Tasnet": ["tasnet.th"],
    # "v1 | Tasnet_extra": ["tasnet_extra.th"],
}
stemming_models_list = []
for model, filename in vr_model_list.items():
    stemming_models_list.append(StemmingModel(name=model, files=[filename], type=VR_ARCH_TYPE))
for model, filename in mdx_model_list.items():
    stemming_models_list.append(StemmingModel(name=model, files=[filename], type=MDX_ARCH_TYPE))
for model, files in demucs_model_list.items():
    stemming_models_list.append(StemmingModel(name=model, files=files, type=DEMUCS_ARCH_TYPE))