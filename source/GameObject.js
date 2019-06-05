class GameObject
{
    constructor(className)
    {
        this.sectorX = 0;
        this.sectorY = 0;
        this.quadrantX = 0;
        this.quadrantY = 0;
        this.entityType = this.constructor.name;

        if (!className.Instances)
        {
            className.Instances = 0;
        }

        className.Instances++;
    }

    distanceToObject(obj2)
    {
        // assumes objects are in the same quadrant, for now
        let xdiff = this.sectorX - obj2.sectorX;
        let ydiff = this.sectorY - obj2.sectorY;
        return Math.sqrt(xdiff*xdiff + ydiff*ydiff);
    }

    setLocationSector(sectorXY)
    {
        this.sectorX = sectorXY.x;
        this.sectorY = sectorXY.y;
    }

    onTorpedoHit(quadrant)
    {
        console.log("Torpedo hit (base class)");
    }

    // randomly generate the number of GameObject instances to put in a new quadrant
    static randomCountForQuadrant(quadrantFreeSpaces)
    {
        var rval = 0;

        let instanceProbabilities = this.quadrantInstanceProbabilities();
        if (instanceProbabilities == null)
        {
            //console.log("Using uniform probability path");
            rval = randomInt(0, this.maxInstancesQuadrant());
        }
        else
        {
            //console.log("Using CDF Probability Path");
            console.assert(instanceProbabilities.length == (1+this.maxInstancesQuadrant()));
            
            rval = randomWithProbabilities(instanceProbabilities);
        }

        rval = Math.min(rval, quadrantFreeSpaces);

        if (!this.Instances)
        {
            this.Instances = 0;
        }

        rval = Math.min(rval, this.maxInstancesGame() - this.Instances);

        console.assert(this.Instances <= this.maxInstancesGame());

        return rval;
    }

    sectorString()
    {
        return "" + (this.sectorX+1) + ", " + (this.sectorY+1);
    }

    quadrantString()
    {
        return "" + (this.quadrantX+1) + ", " + (this.quadrantY+1);
    }

    static minInstancesGame()
    {
        return 0;
    }

    static maxInstancesQuadrant()
    {
        return 8;
    }

    static maxInstancesGame()
    {
        return this.maxInstancesQuadrant() * mapWidthQuadrants * mapHeightQuadrants;
    }

    // returns array containing the probability of each instance count appearing in a quadrant at map generation
    // eg. [.1, .2, .15, .55]
    // means that there's a 10% chance of no instances of the object in a given quadrant
    // there's a 20% chance of 1 instance
    // a 15% chance of 2 instances
    // a 55% chance of 3 instances
    // The base class GameObject method returns null, if we want to just generate uniform probabilities (default)
    // eg. each number between min and max has an equal likelihood.
    // So in the above example, there'd be a 25% chance of either no instance, 1 instance, 2 instances, or 3 instances
    static quadrantInstanceProbabilities()
    {
        return null;
    }
}