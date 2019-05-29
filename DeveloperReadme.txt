*** Generating the source
At the top level, run the script ./compile.sh.  This will concatenate all the smaller files listed in the source directory into a single, 
longer file imported from the HTML, called trekgame.js.

*** Adding a new object type to the game: 

- Define a new class for the game object in a new file of the same name.  (EG, BlackHole.js)

- Add a line at the end of compile.sh in the top level directory to include the new file in the final "trekgame.js" source file. EG: 
IncludeSource BlackHole.js

Make sure this line is above 
IncludeSource TrekGame.js

and below
IncludeSource GameObject.js

- Add the class name to the list of entity types the game will support in source/TrekGame.js
Look for this line:
TrekGame.EntityTypes = [Star, StarBase, Klingon];
And add your class to the list.  EG:
TrekGame.EntityTypes = [Star, StarBase, Klingon, BlackHole];

- Make sure the class extends GameObject.  Eg, 

    class BlackHole extends GameObject
    {
    }

- Implement a toString() method that returns the display character(s) that will appear on the screen.
For example, the enterprise is
    toString()
    {
        return "<*>";
    }

    Make sure the display string length is less than 5 characters long.  
    Do not pad with spaces, the game will do this automatically.

- Optionally, implement overrides of the following static methods:
    static minInstancesGame()
    static maxInstancesQuadrant()
    static maxInstancesGame()

This tells the map generator the limits (high and low) of how many objects to generate.


- Optionally, implement callback member methods to handle various game events.  These include:

    onTorpedoHit()
        - when the object is hit by a torpedo
	
    onPhaserHit(energy, quadrant)
	- Need to add to Enterprise.PhaserTargets[] list in Enterprise.js.  Or whatever other phaser target lists are relevant.
	- Called when the GameObject is hit by a phaser.

- Optionally, if you want a nonuniform probability for different instance counts of each gameobject type, overload static quadrantInstanceProbabilities() and return an array.

For example: 

  static quadrantInstanceProbabilities()
    {
        return [.6,  // 0 klingons, 60% probability
                .15, // 1 klingon,  15% probability
                .1,  // 2 klingons, 10% probability
                .1,  // 3 klingons, 10% probability
                .05   // 4 klingons, 5% probability
        ];
    }

The length of this array must match the value returned by maxInstancesQuadrant() plus one
    