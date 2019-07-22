// planet lets you bombard with torpedoes when adjacent, in order to cause enemy ships to warp in
class Planet extends GameObject
{
    constructor()
    {
        console.log("Planet created!")
        super(Planet);
        this.bombarded = false;
    }

    onTorpedoHit(game)
    {
        gameOutputAppend("\nReport from sector " + this.sectorString());
        gameOutputAppend("The torpedo burns up in the planet's atmosphere.");
    }

    bombard()
    {
        this.bombarded = true;
    }

    toString()
    {
        return "O";
    }

    static maxInstancesGame()
    {
        return Planet.MaxInstances;
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 0;
    }

    static quadrantInstanceProbabilities()
    {
        // 5% chance of a planet in any given quadrant
        return [.95, .05];
    }
}

Planet.MaxInstances = 1;