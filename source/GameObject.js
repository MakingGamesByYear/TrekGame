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
        let rval = randomInt(0, this.maxInstancesQuadrant());
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
}