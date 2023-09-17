import type { AxiosProgressEvent } from "axios";
import axios from "axios";
import logger from "../../shared/logger";
import fs from "fs";
import fsp from "fs/promises";
import { localWeightsPath } from "../utils/constants";
import path from "path";
import jetpack from "fs-jetpack";
import { httpAgent, httpsAgent } from "./agents.ts";
import type { StemmingModel } from "@replay/shared/clients/type-utils.ts";
import axiosRetry from "axios-retry";
axiosRetry(axios, { retries: 2 });
const STEM_MODEL_TO_DOWNLOAD_ON_ONBOARDING = [
  {
    name: "UVR-MDX-NET-Voc_FT.onnx",
    type: "file",
    size: 66762490,
    sha1: "06474f0aa507d12e4384b20fd7adebd4abdd388b",
  },
  {
    name: "UVR-DeEcho-DeReverb.pth",
    type: "file",
    size: 223650277,
    sha1: "f732e6df65dd5d8fa61642f4af8fa26b549e17bc",
  },
] as const;
const requiredFilesDownloader = [
  {
    name: "D32k.pth",
    type: "file",
    size: 142875703,
    sha1: "7535cb958de6d268e2e8acd3365aca09e387a8ea",
  },
  {
    name: "D40k.pth",
    type: "file",
    size: 142875703,
    sha1: "20794ff05a889282b3fa10e272f5ec99077aa70e",
  },
  {
    name: "D48k.pth",
    type: "file",
    size: 142875703,
    sha1: "18a02e23f801e3b9e2442ee189c2e5f147f1d1f5",
  },
  {
    name: "G32k.pth",
    type: "file",
    size: 73811639,
    sha1: "0847ddb0b17a966a91cc2d3da78c1e84daaa4b06",
  },
  {
    name: "G40k.pth",
    type: "file",
    size: 72959671,
    sha1: "089aa9ca76e776aaaa3f0fcc2634bfdc7e336028",
  },
  {
    name: "G48k.pth",
    type: "file",
    size: 75318967,
    sha1: "746988b7ad360d7f3e26067468a054c1456ba91a",
  },
  {
    name: "HP2-人声vocals+非人声instrumentals.pth",
    type: "file",
    size: 63454827,
    sha1: "5c611ff26e118addf5d5980a3fa45a9c98c8c332",
  },
  {
    name: "HP5-主旋律人声vocals+其他instrumentals.pth",
    type: "file",
    size: 63454827,
    sha1: "a4cc6dcd5011f57db58d1a1fa8cf7aef27e8a2f5",
  },
  {
    name: "f0D32k.pth",
    type: "file",
    size: 142875703,
    sha1: "d9187a76bf034e23592c282192af3540a3f851ac",
  },
  {
    name: "f0D40k.pth",
    type: "file",
    size: 142875703,
    sha1: "650feb3c3820ac4d45aaaa06d1dbef8dd36cbc5b",
  },
  {
    name: "f0D48k.pth",
    type: "file",
    size: 142875703,
    sha1: "56056c8cfa66d2d70244a4b71433efe9a9c54c3b",
  },
  {
    name: "f0G32k.pth",
    type: "file",
    size: 73950049,
    sha1: "bf4fc7e438fe6ed93e6dae485044c9d92b21f513",
  },
  {
    name: "f0G40k.pth",
    type: "file",
    size: 73106273,
    sha1: "e36ee1bb13ea45da20efbfa8cd2b151e9c1d938f",
  },
  {
    name: "f0G48k.pth",
    type: "file",
    size: 75465569,
    sha1: "f2bd4612b07193df9fb7d05fffce184e1aeee80a",
  },
  {
    name: "hubert_base.pt",
    type: "file",
    size: 189507909,
    sha1: "ee3a0eb7150ba93435e4ab350292ea161e849c11",
  },
  {
    name: "rmvpe.pt",
    type: "file",
    size: 181189687,
    sha1: "262d527abb05d89e8f26e2ad0256855ab9b3644b",
  },
];
const weights = [
  ...requiredFilesDownloader,
  // also download the mdx net voc_ft model on onboarding
  ...STEM_MODEL_TO_DOWNLOAD_ON_ONBOARDING,
] as const;
type Weight = (typeof weights)[number];
const weightMap = weights.reduce(
  (acc, weight) => {
    acc[weight.name] = weight;
    return acc;
  },
  {} as Record<Weight["name"], Weight>,
);

const knownStemModelsShas = {
  "04573f0d-f3cf25b2.th": "d5020e9e5c5048ba1badd5c0573b18f1f38ebf68",
  "0d19c1c6-0f06f20e.th": "5f739a8b73e09991ce4787757b3e6c3cb50a767e",
  "10_SP-UVR-2B-32000-1.pth": "501be21e26f5bb278760cb5bb6f98b9090078dd8",
  "11_SP-UVR-2B-32000-2.pth": "f25444a364b964133c365a8113d5c3f6c89f199f",
  "12_SP-UVR-3B-44100.pth": "7cbbc22001dd2ed80b0f0acb88251cf24eb121e9",
  "13_SP-UVR-4B-44100-1.pth": "e982167801f5c26d90dc1993dae6ad8163dd8465",
  "14_SP-UVR-4B-44100-2.pth": "e0707c005a58f321ff5c4f22cf0c3579bfb50692",
  "14fc6a69-a89dd0ee.th": "e067928ff5b25a5213c54d795b901f0327deaa56",
  "15_SP-UVR-MID-44100-1.pth": "96e296ba3e5b976eac7db1511db871d59f61eee3",
  "16_SP-UVR-MID-44100-2.pth": "bf0fdfe4afaa46a86c59057e0aaf95bc14b1a83a",
  "17_HP-Wind_Inst-UVR.pth": "aa290d2eb85b08111dc64223ede0c794423e5757",
  "1_HP-UVR.pth": "85a608f4f338a83f47a8814a393f98134c33ab86",
  "1ef250f1-592467ce.th": "69019d7711f47c7daf5edd0de048c036c0fbda6d",
  "2_HP-UVR.pth": "5d1aeee552db6501bec0a308dd3848fcd0204eff",
  "305bc58f-18378783.th": "7e5d2b4b809489665f1e6f3ce9d0677035c2948b",
  "3_HP-Vocal-UVR.pth": "14dc475a148334d21ee7c60ad42fa08d81e7346a",
  "42e558d4-196e0e1b.th": "5b8ca4c7bbf1b7b98d662d12da541e625ca419a9",
  "464b36d7-e5a9386e.th": "8939640c3bb552ff04d9aa828193518835c448ba",
  "4_HP-Vocal-UVR.pth": "d6c75e7025a752791d0a05bcd17a595f861a38cc",
  "5_HP-Karaoke-UVR.pth": "dd91e87d8f9e699e03af82d41e374955ec713d51",
  "5c90dfd2-34c22ccb.th": "bd70ab824ae76d09d1cd141c3cf3810413c85a6c",
  "5d2d6c55-db83574e.th": "28b5d0e6fcb9a02a1678f6d87958e94e031b5c54",
  "6_HP-Karaoke-UVR.pth": "2a26bc810253b4f961869f997ebf889b3e8c82ab",
  "6b9c2ca1-3fd82607.th": "a63bde8897a9e48ab8a87cb27a3c4fe65b4d0f6d",
  "75fc33f5-1941ce65.th": "97fbe27da94e3176f3fe8459ce5bbcde36f98218",
  "7_HP2-UVR.pth": "c3f9f8fac4061203e7d95e08ef33a3aef0817704",
  "7d865c68-3d5dd56b.th": "9fabece9eff855da428ffdc8767debc4232c87c5",
  "7ecf8ec1-70f50cc9.th": "952f33346f872912d9bc3d1a2f5aa301c8410f58",
  "7fd6ef75-a905dd85.th": "f90c32d6601cb0c1356f149ff7fa49b221e5cfaa",
  "83fc094f-4a16d450.th": "4f9f269b6525efda950d9ab13b12936890401cc3",
  "8_HP2-UVR.pth": "df8d65832091fbdd1a513ee804a04b1c3820125b",
  "902315c2-b39ce9c9.th": "e1599a284638a46c57438a096aaa09507ebc6156",
  "92cfc3b6-ef3bcb9c.th": "4dbf1202934e9b12b72cf9093f2afafce3ec8a2e",
  "955717e8-8726e21a.th": "cf5895b9596762ae7c44973978e40744bef13666",
  "9_HP2-UVR.pth": "655ee19a5a50d2b444ff0c9cfd3aa386d13c90bd",
  "9a6b4851-03af0aa6.th": "9296ead31f8c533faee6baf86507b0a1109ab9d6",
  "Kim_Inst.onnx": "408d6710d3dc583e458f8364f32382276215b969",
  "Kim_Vocal_1.onnx": "7ea42a73d72a533f258ae2c69c46e0116ec62985",
  "Kim_Vocal_2.onnx": "c44d82e00247164af561573af9310461aa4bb384",
  "MDX23C_D1581.ckpt": "d4e2aa9a16dff40e0bc3fd35d321c2217d35286d",
  "MGM_HIGHEND_v4.pth": "52ebff4a83a519754fdf6a018c3ee5436b21311a",
  "MGM_LOWEND_A_v4.pth": "34ceef6a5cd422d693aa0cbd4d331cf547d52b10",
  "MGM_LOWEND_B_v4.pth": "2dbb1904b2e80b7bfd2b09cab6766f261591c708",
  "MGM_MAIN_v4.pth": "3c281e900a248c5f11b73e11b2a476001a4779d0",
  "Reverb_HQ_By_FoxJoy.onnx": "b36d0c61ee88d3d18285ee43c24143d97e6ec1fc",
  "UVR-De-Echo-Aggressive.pth": "8263550c62952a14d20912422ad3c53186183260",
  "UVR-De-Echo-Normal.pth": "c5b03542ad58c27734f673afbf6481630edd3179",
  "UVR-DeEcho-DeReverb.pth": "f732e6df65dd5d8fa61642f4af8fa26b549e17bc",
  "UVR-DeNoise-Lite.pth": "79edf964c7d9450a6d03f6a60b699b3baf35c54d",
  "UVR-DeNoise.pth": "ba22d212889183971e42f4ada86cf6bcc184aa2a",
  "UVR-MDX-NET-Inst_1.onnx": "4b33a1784cf01d6c6f8aa9a11c7193afa4e1ada3",
  "UVR-MDX-NET-Inst_2.onnx": "448f7fde2814f0ce138e898e30b7c99459563c23",
  "UVR-MDX-NET-Inst_3.onnx": "f2b66f5cbe606b8df27254676dd346399a6fbaeb",
  "UVR-MDX-NET-Inst_HQ_1.onnx": "ee669bd5fe7e402ff9df73f82505d92a51a4865d",
  "UVR-MDX-NET-Inst_HQ_2.onnx": "b7d03f3bd3508c169a09e1071b749b8eae7ab5f4",
  "UVR-MDX-NET-Inst_HQ_3.onnx": "2ac2ee93a120e07678daec3de1fe33e0a8c1b03c",
  "UVR-MDX-NET-Inst_Main.onnx": "c180fd717fb3d242086a898ce234ba53763a0603",
  "UVR-MDX-NET-Voc_FT.onnx": "06474f0aa507d12e4384b20fd7adebd4abdd388b",
  "UVR_Demucs_Model_1.yaml": "eed1d6d6a284fb8e956c29c6068741c055bdcca8",
  "UVR_Demucs_Model_2.yaml": "1c59b8326d581de4c6053e8273b7b6f5bf99181d",
  "UVR_Demucs_Model_Bag.yaml": "8fd26d80b9828aec0d2b3e8d79b5c29cef1bb401",
  "UVR_MDXNET_1_9703.onnx": "d41549aea7e5b41ae8e209795d63314867845860",
  "UVR_MDXNET_2_9682.onnx": "a22f7eea300255bd25f348aadb2923b474b5a53e",
  "UVR_MDXNET_3_9662.onnx": "50ce06a9d4f72f0b020d147e5088fac20830c618",
  "UVR_MDXNET_9482.onnx": "44b4477ef604468059c1e649937e0abc0a3dd551",
  "UVR_MDXNET_KARA.onnx": "439cf0f114633c55dd1bf353943a059fdb28eebf",
  "UVR_MDXNET_KARA_2.onnx": "8fcd62221c8f4e70cd666bdbf4d7be1175f7b4e1",
  "UVR_MDXNET_Main.onnx": "c3c89bb38713115940588c19bbcef0eb557d1465",
  "a1d90b5c-ae9d2452.th": "67e66d23b6908a1ef7c61a544482eac8aba211c4",
  "b72baf4e-8778635e.th": "ffd7c3279f01df06a8aa0dc5120a936a3985aa88",
  "c511e2ab-fe698775.th": "69e612bd5b2cc35fd47fa44a224916fd064f6854",
  "cfa93e08-61801ae1.th": "339751ff3e5fae50bbc259292b9223dce05f3035",
  "d12395a8-e57c48e6.th": "548b98fa060daa51cc625088284f93092531a69d",
  "demucs-e07c671f.th": "205eb210876925e1e83fe8b5b3f93137c722635e",
  "demucs.th": "189de06b75016e3401794976fe0af29186e44b27",
  "demucs48_hq-28a1282c.th": "0959d23dda3e7082f7358fcb69fa9056d5a4b42c",
  "demucs_extra-3646af93.th": "3ef3d843a05bf62024db25805ccec47e138bf9e7",
  "demucs_extra.th": "72871ddf0184af4775004d3d4493a7a25f6eb6b0",
  "demucs_unittest-09ebc15f.th": "3a0f0fad42b1f6692f24fb1b80c71ebc1d26bddc",
  "e51eebcc-c1b80bdd.th": "a2c7d29884680828be834f14896c321c6a102f71",
  "ebf34a2d.th": "342d765764847b85640a66a9f2cdd6fbcc9e1115",
  "ebf34a2db.th": "babd2c21f453a133fa3a2a5c6664db9d77156de9",
  "f7e0c4bc-ba3fe64a.th": "1faf1371d09d5c2f27df5137a1a5b04bfbc54bb4",
  "fa0cb7f9-100d8bf4.th": "09fce202deb9a55104349e9ba22041e88fa63a01",
  "files.txt": "015e121f6f20f754a0ce35a0d58e5fa6686319e6",
  "hdemucs_mmi.yaml": "622fe35717ba82138b6d19e3bed9b8e529beee5d",
  "htdemucs.yaml": "316b4798813afc9ce2fd8a5c985d402f829f4271",
  "htdemucs_6s.yaml": "5318fc3c5421780755613282482c87cbbd4e756d",
  "htdemucs_ft.yaml": "8bf68236dd895633d220c8c3de02e8cdbd6721a3",
  "kuielab_a_bass.onnx": "e70f2236302c70416df7c900101ec2bf63edca48",
  "kuielab_a_drums.onnx": "905d89d5ee200bda840a0b361b8782b241c361d1",
  "kuielab_a_other.onnx": "0d9b23397ac640e27cb69e36c6a432d507ce7317",
  "kuielab_a_vocals.onnx": "ab0c97e83193454f2130d88dbac794c56f0398b1",
  "kuielab_b_bass.onnx": "5d08a2ba4b236ddbb8fe54c6760389741e7f17ea",
  "kuielab_b_drums.onnx": "18846510de733ce0408ecfd9a790965e5efcdec8",
  "kuielab_b_other.onnx": "03b569a6ec37de46ffc003a9c5dddfc5e4c45aed",
  "kuielab_b_vocals.onnx": "6eadf3025bed8e0ca505e29b2736b63aff99d61f",
  "light.th": "93260890956713b2a4dda19af49a178e85072620",
  "light_extra.th": "9a21ecc70e7fd0f484bc383b75749fbd23f0703e",
  "mdx.yaml": "6ae5fa6bb36099afc325933aba3a4f9c0916461e",
  "mdx_extra.yaml": "e89bc0ba47bd908ffa70c5fa1e5403b50a48fc1e",
  "mdx_extra_q.yaml": "0a0a8920bdf88d1f0cd3052387164efa5b4ea424",
  "mdx_q.yaml": "372cbcc0661af6a4063c5c024f1c1bd9deea2821",
  "repro_mdx_a.yaml": "774070b83f925bcbe367aa263a1fc5f32c3c90c8",
  "repro_mdx_a_hybrid_only.yaml": "253a15354e150e26edc5859fbafce591faa1c46f",
  "repro_mdx_a_time_only.yaml": "090fd3bb5e1f9203c7d4724a9ccdf68ea53e6959",
  "tasnet-beb46fac.th": "434098ff271b03fe6fab169294a2f573c8d44dd2",
  "tasnet.th": "c70e419e35d61523c64d49911e3c8dd10ab9a20b",
  "tasnet_extra-df3777b2.th": "5049c0652513b9fa850eec333ea0d00559915d1f",
  "tasnet_extra.th": "0dd6c1e17e4a56bd4cef984dba3333bd262dd71d",
} as const;
class RequiredFilesController {
  progress: null | AxiosProgressEvent = null;
  stemProgress: Record<string, AxiosProgressEvent | null> = {};
  stemError: Record<string, object> = {};
  numFilesDownloading: Record<string, { total: number; remaining: number }> = {};
  private downloadsInProgress = new Set<string>();
  isDownloading: boolean = false;
  error: null | object = null;
  fileCount: number = 0;
  totalSize: number = 0;
  totalSizeDownloaded: number = 0;
  currentFileNum: number = 0;

  getLocallyDownloadedModelFiles = async () => {
    const files = (await jetpack.dirAsync(localWeightsPath))?.list() || [];
    return files.filter((file) => weightMap[file as Weight["name"]]) as Weight["name"][];
  };

  hasDownloadedModelWeights = async () => {
    const files = await this.getLocallyDownloadedModelFiles();
    if (files.length < weights.length) {
      return false;
    }
    const filesWithSizes = await Promise.all(
      files.map(async (file) => {
        const stat = await fsp.stat(path.join(localWeightsPath, file));
        return { file, size: stat?.size };
      }),
    );

    const fileSizeMap = filesWithSizes.reduce(
      (acc, file) => {
        acc[file.file] = file.size;
        return acc;
      },
      {} as Record<string, number>,
    );
    return weights.every((model) => weightMap[model.name]?.size === fileSizeMap[model.name]);
  };

  removeModelWeights = async () => {
    const files = await this.getLocallyDownloadedModelFiles();
    await Promise.all(files.map((file) => jetpack.removeAsync(path.join(localWeightsPath, file))));
  };

  verifyModelWeights = async () => {
    const files = await this.getLocallyDownloadedModelFiles();
    const localShas = await Promise.all(
      files.map(async (file) => {
        const sha = await jetpack.inspectAsync(path.join(localWeightsPath, file), { checksum: "sha1" });
        return { file, sha: sha?.sha1 };
      }),
    );
    if (localShas.length < weights.length) {
      return false;
    }
    for (const sha of localShas) {
      if (!sha.sha) {
        return false;
      }
      if (sha.sha !== weightMap[sha.file]?.sha1) {
        return false;
      }
    }
    return true;
  };
  listAndDownloadModels = async () => {
    if (this.isDownloading) {
      return;
    }
    this.progress = null;
    this.isDownloading = true;
    this.error = null;
    this.totalSizeDownloaded = 0;
    this.currentFileNum = 0;

    this.totalSize = weights.reduce((acc, model) => {
      return acc + Number(model.size);
    }, 0);
    this.fileCount = weights.length;

    for (const model of weights) {
      this.currentFileNum++;
      this.progress = null;
      await this.download(model);
      this.totalSizeDownloaded += Number(model.size);
    }
    this.isDownloading = false;
  };
  download = async (object: Weight) => {
    const filename = object.name;
    if (!filename) {
      return;
    }
    const stat = await jetpack
      .inspectAsync(path.join(localWeightsPath, object.name), { checksum: "sha1" })
      .catch(() => null);
    if (weightMap[filename] && stat?.sha1 === weightMap[filename].sha1) {
      return;
    }

    const url = `https://assets.replay-music.xyz/${filename}`;

    try {
      return new Promise<void>(async (resolve, reject) => {
        const response = await axios.get(url, {
          responseType: "stream",
          onDownloadProgress: (progressEvent) => {
            this.progress = progressEvent;
          },
          httpsAgent,
          httpAgent,
        });
        const writeStream = fs.createWriteStream(path.join(localWeightsPath, filename), { flags: "w" });
        response.data.pipe(writeStream);
        response.data.on("end", () => {
          resolve();
        });
        response.data.on("error", (error: any) => {
          logger.error(error);
          this.error = error;
          reject();
        });
      });
    } catch (e) {
      logger.error(e);
    }
  };

  listStemModels = async () => {
    const files = (await jetpack.dirAsync(localWeightsPath))?.list() || [];
    const filesOnDevice = files.filter((file) => !requiredFilesDownloader.find((model) => model.name === file));
    return filesOnDevice.filter((file) => !this.downloadsInProgress.has(file));
  };

  private downloadStemFile = async (filename: string, id: string) => {
    if (!filename) {
      return;
    }

    const knownSha = knownStemModelsShas[filename];
    if (knownSha) {
      const stat = await jetpack
        .inspectAsync(path.join(localWeightsPath, filename), { checksum: "sha1" })
        .catch(() => null);
      // no need to redownloadO
      if (stat?.sha1 === knownSha) {
        return;
      }
    }

    const url = `https://assets.replay-music.xyz/${filename}`;

    return new Promise<void>(async (resolve, reject) => {
      try {
        delete this.stemError[id];
        const response = await axios.get(url, {
          responseType: "stream",
          onDownloadProgress: (progressEvent) => {
            this.stemProgress[id] = progressEvent;
          },
          httpsAgent,
          httpAgent,
        });
        const fullDownloadPath = path.join(localWeightsPath, filename);
        const writeStream = fs.createWriteStream(fullDownloadPath, { flags: "w" });
        const stream = response.data.pipe(writeStream);
        stream.on("finish", async () => {
          if (knownSha) {
            const stat = await jetpack.inspectAsync(fullDownloadPath, { checksum: "sha1" }).catch(() => null);
            if (stat?.sha1 !== knownSha) {
              logger.error(`Sha1 Mismatch for ${filename} - ${stat?.sha1} !== ${knownSha}}`);
              await jetpack.removeAsync(fullDownloadPath);
              reject(new Error("Sha1 mismatch, corrupted download"));
              return;
            }
          }
          delete this.stemProgress[id];
          resolve();
        });
        response.data.on("error", (error: any) => {
          delete this.stemProgress[id];
          logger.error(error);
          this.stemError[id] = error;
          reject(error);
        });
      } catch (e: any) {
        this.stemError[id] = e;
        logger.error(e);
      }
    });
  };
  downloadStemModel = async (model: StemmingModel) => {
    const id = model.name;
    const files = model.files;
    try {
      const numFiles = files.length;
      this.numFilesDownloading[id] = { total: numFiles, remaining: numFiles };
      for (const filename of files) {
        this.downloadsInProgress.add(filename);
        await this.downloadStemFile(filename, id);
        this.numFilesDownloading[id].remaining--;
        this.downloadsInProgress.delete(filename);
      }
    } catch (e: any) {
      this.stemError[id] = e;
      logger.error(e);
    } finally {
      files.forEach((filename) => this.downloadsInProgress.delete(filename));
    }
  };
}

export const requiredFilesController = new RequiredFilesController();
