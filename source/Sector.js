class Sector
{
    constructor(widthSubsectorsIn, heightSubsectorsIn, x, y)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.width = widthSubsectorsIn;
        this.height = heightSubsectorsIn;
        this.sectorEntities = new Array();
        this.x = x;
        this.y = y;
    }

    collisionLog(strToPrint)
    {
        if (Sector.CollisionLog)
        {
            console.log(strToPrint);
        }
    }

    populateFromJSData(entitiesSectorJS)
    {
        var x;
        for (x in entitiesSectorJS.sectorEntities)
        {
            let entData = entitiesSectorJS.sectorEntities[x];

            // we construct and insert the enterprise entity elsewhere.
            if (entData.entityType != "Enterprise")
            {
                let ctype = EntityMap.get(entData.entityType);

                let entityObj = new ctype(); 
                Object.assign(entityObj, entData);

                this.sectorEntities.push(entityObj);
            }
        }
    }

    removeEntity(entity)
    {
        let rmindex = this.sectorEntities.indexOf(entity);
        if (rmindex == -1)throw "Entity not found";
        this.sectorEntities.splice( rmindex, 1 );
    }

    entityAtLocation(nextXCoord, nextYCoord)
    {
        nextXCoord = Math.floor(nextXCoord);
        nextYCoord = Math.floor(nextYCoord);
        
        for (var x in this.sectorEntities)
        {
            let objTest = this.sectorEntities[x];

            if ((objTest.subsectorX == nextXCoord) && (objTest.subsectorY == nextYCoord))
            {
                return objTest;
            }
        }

        return null;
    }

    // return a tuple containing
    // the last subsector prior to the intersection
    // and the intersection object (null if none)
    intersectionTest(subsectorX, subsectorY, subsectorXEnd, subsectorYEnd, maxT = 1.0)
    {
        checkArgumentsDefinedAndHaveValue(arguments);

        // polar to euclidean coordinates
        let xVec = subsectorXEnd - subsectorX;
        let yVec = subsectorYEnd - subsectorY;

        // we'll step through the grid in in increments of one cell; -1 if the x / y direction are negative
        let xNextF = xVec > 0.0 ? 1.0 : -1.0;
        let yNextF = yVec > 0.0 ? 1.0 : -1.0;

        // start in the middle of the cell.
        let startCoordX = Math.floor(subsectorX) + .5;
        let startCoordY = Math.floor(subsectorY) + .5;

        let endCoordX = Math.floor(subsectorXEnd) + .5;
        let endCoordY = Math.floor(subsectorYEnd) + .5;

        let currentCoordX = startCoordX;
        let currentCoordY = startCoordY;

        // return values
        let lastCoordX = startCoordX;
        let lastCoordY = startCoordY;
        
        let intersectionObject = null;

        this.collisionLog("start coord " + (startCoordX) + " " + (startCoordY));
        this.collisionLog("end coord " + (endCoordX) + " " + (endCoordY));
        this.collisionLog("vec " + (xVec) + " " + (yVec));

        var nextXInteger = (xVec > 0.0) ? Math.floor(startCoordX) + 1.0 : Math.floor(startCoordX) - 1.0;
        var nextYInteger = (yVec > 0.0) ? Math.floor(startCoordY) + 1.0 : Math.floor(startCoordY) - 1.0;
    
        var steps = 0;

        this.collisionLog("next x y integer coords : " + nextXInteger + " " + nextYInteger);

        // get ray t values for the next cell on each axis
        let tXBound = Math.abs(.50 / xVec);//(nextXInteger - startCoordX) / xVec;
        let tYBound = Math.abs(.50 / yVec);//(nextYInteger - startCoordY) / yVec;

        let txIncrement = Math.abs(1.0 / xVec);
        let tyIncrement = Math.abs(1.0 / yVec);

        // prevent divide by 0
        tXBound = Math.abs(xVec) > .00001 ?  tXBound : Number.MAX_VALUE;
        tYBound = Math.abs(yVec) > .00001 ?  tYBound : Number.MAX_VALUE;

        while (true)
        {
            lastCoordX = Math.floor(currentCoordX);
            lastCoordY = Math.floor(currentCoordY);

            this.collisionLog("t's : " + tXBound + " " + tYBound);

            if (Math.min(tXBound, tYBound) > maxT)
            {
                this.collisionLog("breaking for max t");
                break;
            }

            if (tXBound < tYBound) // hit the x boundary first?
            {
                this.collisionLog("step x " + tXBound);

                currentCoordX = nextXInteger;
                nextXInteger += xNextF;

                tXBound += txIncrement;
            }
            else // hit the y boundary first
            {
                this.collisionLog("step y " + tYBound);

                currentCoordY = nextYInteger;
                nextYInteger += yNextF;

                tYBound += tyIncrement;
            }

            this.collisionLog("stepping to " + currentCoordX + " " + currentCoordY);

            console.assert((currentCoordX != lastCoordX) || (currentCoordY != lastCoordY));

            this.collisionLog("next x y integer coords : " + nextXInteger + " " + nextYInteger);

            if (currentCoordX < 0 || currentCoordY < 0 || currentCoordX >= sectorWidthSubsectors || currentCoordY >= sectorHeightSubsectors)
            {
                this.collisionLog("breaking for out of bounds");
                break;
            }

            // handle intersections
            intersectionObject = this.entityAtLocation(currentCoordX, currentCoordY);

            if (intersectionObject != null)
            {
                this.collisionLog("intersection return");
                break;
            }

            // no escape conditions, so we'll count this as a step
            steps++;
        }

        this.collisionLog("returning with lastcoord " + lastCoordX + " " + lastCoordY);
        this.collisionLog("returning with intersection obj " + intersectionObject);
        this.collisionLog("returning with steps  " + steps);

        return {lastX : lastCoordX, lastY : lastCoordY, intersects : intersectionObject, stepIterations:steps};
    }

    countEntitiesOfType(classtype)
    {
        var rval=0;
        for (var x in this.sectorEntities)
        {
            if (this.sectorEntities[x].constructor == classtype)
            {
                rval++;
            }
        }
        return rval;
    }

    getEntitiesOfType(classtype)
    {
        return this.sectorEntities.filter(function(item){return item.constructor == classtype});
    }

    getAdjacentEntitiesOfType(adjacentToObj, classtype)
    {
        let sblist = this.getEntitiesOfType(classtype);
        return sblist.filter(function(sb){return sb.isAdjacentTo(adjacentToObj)});
    }

    klingonsFire(target, game)
    {
        let klist = this.getEntitiesOfType(Klingon);

        let descStr = game.primeUniverse ? "Klingon" : "Federation";
        if (klist.length > 1)
        {
            gameOutputAppend("\nThe " + descStr + " vessels fire their phasers.");
        }
        else if (klist.length)
        {
            gameOutputAppend("\nThe " + descStr + " vessel fires its phasers.");
        }

        for (var x in klist)
        {
            klist[x].firePhasers(target, game);
        }
    }

    createEntities(entityTypes)
    {
        var entityIdx;
        for (entityIdx in entityTypes)
        {
            let entityType = entityTypes[entityIdx];

            let numEntities = entityType.randomCountForSector(this.emptySquares(), this.countEntitiesOfType(entityType));

            for (let i =0; i < numEntities; i++ )
            {
                var ent = new entityType();
                this.addEntityInFreeSubsector(ent);
            }
        }
    }

    addEntityInFreeSubsector(entity)
    {
        entity.sectorX = this.x;
        entity.sectorY = this.y;
        entity.setLocationSubsector(this.getEmptySquare());
        this.sectorEntities.push(entity);
    }

    addEntity(entity)
    {
        entity.sectorX = this.x;
        entity.sectorY = this.y;

        this.sectorEntities.push(entity);
    }

    emptySquares()
    {
        return this.width*this.height - this.sectorEntities.length;
    }

    getEmptySquare()
    {
        console.assert(this.width * this.height > this.sectorEntities.length);

        if (this.sectorEntities.length >= this.width*this.height)
        {
            return null;
        }

        let emptyFound = false;

        let testRandom = randomInt(0, (this.width*this.height)-1);

        while (!emptyFound)
        {
            let randomX = testRandom % this.width;
            let randomY = Math.floor(testRandom / this.height);

            var entityIdx;
            emptyFound = true;
            for (entityIdx in this.sectorEntities)
            {
                let entity = this.sectorEntities[entityIdx];
                if (entity.subsectorX == randomX && entity.ssectorY == randomY)
                {
                    emptyFound = false;
                    break;
                }
            }

            if (emptyFound)
            {
                return {x : randomX, y : randomY};
            }

            testRandom++;
        }
    }

    toString()
    {
        let borderStringPost = "   " + mapFooter(sectorWidthSubsectors) + '\n';
        let borderStringPre = "   " + mapHeader(sectorWidthSubsectors); 

        let sectorStringGrid = new Grid(this.width, this.height, function(){return " ".padStart(subsectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in this.sectorEntities)
        {
            let gameObject = this.sectorEntities[gameObjectIndex];
            let objStr = gameObject.toString().padStart(subsectorDisplayWidthChars, ' ');
            sectorStringGrid.setValue(gameObject.subsectorX, gameObject.subsectorY, objStr);
        }

        let mapString = sectorStringGrid.toString();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";
    }
}

Sector.CollisionLog = false;