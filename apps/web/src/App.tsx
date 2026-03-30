import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./PhaserGame";

interface ISceneWithChangeScene extends Phaser.Scene {
  changeScene: () => void;
}

function App() {
  const phaserRef = useRef<IRefPhaserGame | null>(null);
  const [currentSceneKey, setCurrentSceneKey] = useState<string>("");

  const currentScene = (scene: Phaser.Scene) => {
    setCurrentSceneKey(scene.scene.key);
  };

  const handleStartGame = () => {
    const scene = phaserRef.current?.scene as ISceneWithChangeScene | null;
    if (scene) {
      scene.changeScene();
    }
  };

  const handleEndGame = () => {
    const scene = phaserRef.current?.scene as ISceneWithChangeScene | null;
    if (scene) {
      scene.changeScene();
    }
  };

  const isInGame = currentSceneKey === "Game" || currentSceneKey === "Game2";
  const isInMainMenu = currentSceneKey === "MainMenu";

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
      <div>
        {isInMainMenu && (
          <div>
            <button className="button" onClick={handleStartGame}>
              Start Game
            </button>
          </div>
        )}
        {isInGame && (
          <div>
            <button className="button" onClick={handleEndGame}>
              End Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
