# Usage
1. Install node.js, and the libraries required.
2. ``npm install socket.io``
3. ``npm install body-parser``
4. launch game server with ``node server.js``
5. navigate to [localhost:8000](https://localhost:8000) to view the game and play. Try joining with different tabs

# TODO
1. Make player movement faster (at 3 now, maybe to 8?)
2. use player.end so that player is never in idle position (always moving in last direction pressed)
3. Make array of collisionPoints and one for playerPoints containing the trails in the game, and the trails left by the player, respectively. This way we can render them in separate colors.
