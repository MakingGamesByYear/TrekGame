class GameObject
{
    constructor(className)
    {
        this.sectorX = 0;
        this.sectorY = 0;
        this.subsectorX = 0;
        this.subsectorY = 0;
        this.entityType = this.constructor.name;

        if (className)
        {
            if (!className.Instances)
            {
                className.Instances = 0;
            }

            className.Instances++;
        }
    }

    isAdjacentTo(obj2)
    {
        let sameSector = (this.sectorX == obj2.sectorX) && (this.sectorY == obj2.sectorY);
        let xSubsectorDiff = Math.abs(this.subsectorX - obj2.subsectorX);
        let ySubsectorDiff = Math.abs(this.subsectorY - obj2.subsectorY);

        console.log("quad x y " + sameSector + " " + xSubsectorDiff + " " + ySubsectorDiff);

        return sameSector && (xSubsectorDiff <= 1) && (ySubsectorDiff <= 1);
    }

    distanceToObject(obj2)
    {
        return this.distanceToSubsectorLoc(obj2.subsectorX, obj2.subsectorY);
    }

    distanceToSubsectorLoc(subsectorX, subsectorY)
    {
        let xdiff = this.subsectorX - subsectorX;
        let ydiff = this.subsectorY - subsectorY;
        return Math.sqrt(xdiff*xdiff + ydiff*ydiff);
    }

    setLocationSector(sectorXY)
    {
        this.sectorX = sectorXY.x;
        this.sectorY = sectorXY.y;
    }

    setLocationSubsector(subsectorXY)
    {
        this.subsectorX = subsectorXY.x;
        this.subsectorY = subsectorXY.y;
    }


    onTorpedoHit(game)
    {
        console.log("Torpedo hit (base class)");
    }

    // randomly generate the number of GameObject instances to put in a new sector
    static randomCountForSector(sectorFreeSpaces, instancesInSector)
    {
        var rval = 0;

        let instanceProbabilities = this.sectorInstanceProbabilities();
        if (instanceProbabilities == null)
        {
            //console.log("Using uniform probability path");
            rval = randomInt(0, this.maxInstancesSector());
        }
        else
        {
            //console.log("Using CDF Probability Path");
            console.assert(instanceProbabilities.length == (1+this.maxInstancesSector()));
            
            rval = randomWithProbabilities(instanceProbabilities);
        }

        rval = Math.min(rval, sectorFreeSpaces);

        // createEntities occurs after we place our minimum number of entities around the map.
        // so if we've already created some entities in this quadrant just deduct them from the ones
        // the rng says we need to create.

        if (!this.Instances)
        {
            this.Instances = 0;
        }

        rval = Math.min(rval, this.maxInstancesGame() - this.Instances);

        console.assert(this.Instances <= this.maxInstancesGame());

        rval = Math.max(rval - instancesInSector, 0);

        return rval;
    }

    subsectorString()
    {
        return "" + (this.subsectorX+1) + ", " + (this.subsectorY+1);
    }

    sectorString()
    {
        return "" + (this.sectorX+1) + ", " + (this.sectorY+1);
    }

    subsectorStringFractional()
    {
        let subsectorXFractional = (this.sectorX+1) + (this.subsectorX / sectorWidthSectors);
        let subsectorYFractional = (this.sectorY+1) + (this.subsectorY / sectorHeightSectors);
        return "("+subsectorXFractional+","+subsectorYFractional+")";
    }

    static minInstancesGame()
    {
        return 0;
    }

    static maxInstancesSector()
    {
        return 8;
    }

    static maxInstancesGame()
    {
        return this.maxInstancesSector() * mapWidthSectors * mapHeightSectors;
    }

    // returns array containing the probability of each instance count appearing in a sector at map generation
    // eg. [.1, .2, .15, .55]
    // means that there's a 10% chance of no instances of the object in a given sector
    // there's a 20% chance of 1 instance
    // a 15% chance of 2 instances
    // a 55% chance of 3 instances
    // The base class GameObject method returns null, if we want to just generate uniform probabilities (default)
    // eg. each number between min and max has an equal likelihood.
    // So in the above example, there'd be a 25% chance of either no instance, 1 instance, 2 instances, or 3 instances
    static sectorInstanceProbabilities()
    {
        return null;
    }
}