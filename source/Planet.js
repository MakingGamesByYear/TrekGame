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
        gameOutputAppend("\nReport from subsector " + this.subsectorString());
        gameOutputAppend("The torpedo burns up in the planet's atmosphere.");
    }

    bombard()
    {
        gameOutputAppend("\nYou bombard the planet.  The base and every living inhabitant inside is reduced to ash.  Let's see if the enemy takes the bait.");
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

    static maxInstancesSector()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return Planet.MinInstances;
    }

    static sectorInstanceProbabilities()
    {
        // 5% chance of a planet in any given sector
        return [.95, .05];
    }
}

Planet.MaxInstances = 3;
Planet.MinInstances = 1;

