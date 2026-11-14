/** Fundo (vivo e de cena), troca de tema em vídeo e partículas do login. Ver design/CENA-ESCRITORIO.md e docs/06. */
export { LiveBackground, Waves } from './LiveBackground';
export { SceneBackground } from './SceneBackground';
export { ParticleSphere } from './ParticleSphere';
export { CENAS, type Cena, type Janelas, type Luminaria } from './cenas';
export { trocarTema, aguardarCorteDaTroca, aguardarTrocaDeTema, temaEmTroca } from './trocarTema';
export { usePreviaDaTela } from './previaDaTela';
export { cenaAtiva } from './sceneSync';
