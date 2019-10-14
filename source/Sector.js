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

        // return values
        let lastCellBeforeIntersectionX = startCoordX;
        let lastCellBeforeIntersectionY = startCoordY;
        let intersectionObject = null;

        //console.log("start coord " + (startCoordX) + " " + (startCoordY));
        //console.log("end coord " + (endCoordX) + " " + (endCoordY));
        //console.log("vec " + (xVec) + " " + (yVec));

        var nextXCoord = 0;
        var nextYCoord = 0;

        let currentT = 0.0;

        var steps = 0;
        while (true)
        {
            // we have, given a start coordinate and a direction vector, the parametric equation of a line
            // Pt = P0 + D*t
            // From this we can derive the parameter t at which the line will reach a particular X or Y value
            // X_t = X_0 + V_x * t
            // Y_t = Y_0 + V_y * t
            // implies
            // (X_t - X_0) / V_x = t
            // or
            // (Y_t - Y_0) / V_y = t
            // so we can figure out what the next cell on the x axis is (current plus or minus one) and figure
            // out the t parameter where the line crosses it.  
            // We can do the same for the next call on the y axis.
            // Then, whichever cell has the lower t parameter the line crosses first.
            // Because there's a division and it's possible the direction vector has a zero component, we'll check for divide by zero

            nextXCoord = Math.floor(lastCellBeforeIntersectionX + xNextF);
            nextYCoord = Math.floor(lastCellBeforeIntersectionY + yNextF);

            //console.log("next " + nextXCoord + " " + nextYCoord);

            let tXBound = ((nextXCoord+.5) - startCoordX) / xVec;
            let tYBound = ((nextYCoord+.5) - startCoordY) / yVec;

            tXBound = Math.abs(xVec) > .00001 ?  tXBound : Number.MAX_VALUE;
            tYBound = Math.abs(yVec) > .00001 ?  tYBound : Number.MAX_VALUE;

            if (tXBound < tYBound) // hit the x boundary first.
            {
                //console.log("xb " + tXBound);
                currentT = tXBound;
                nextYCoord = startCoordY + yVec * currentT;
            }
            else
            {
                //console.log("yb");
                currentT = tYBound;
                nextXCoord = startCoordX + xVec * currentT;
            }

            if (currentT > maxT)
            {
                //console.log("Exceeded jump range "+ currentT);
                break;
            }

            intersectionObject = this.entityAtLocation(nextXCoord, nextYCoord);

            if (intersectionObject != null)
            {
                //console.log("intersection return");
                break;
            }

            if (nextXCoord < 0 || nextXCoord >= sectorWidthSubsectors || nextYCoord < 0 || nextYCoord >= sectorHeightSubsectors)
            {
                //console.log("next out of bounds " + nextXCoord + " " + nextYCoord);
                break;
            }

            //console.log("T is at " + currentT);
            lastCellBeforeIntersectionX = nextXCoord;
            lastCellBeforeIntersectionY = nextYCoord;

            steps++;

            //console.log("cell step" + (lastCellBeforeIntersectionX) + " " + (lastCellBeforeIntersectionY));
        }

        //console.log("cell end " + (lastCellBeforeIntersectionX) + " " + (lastCellBeforeIntersectionY)+ " " + intersectionObject);
        return {lastX : lastCellBeforeIntersectionX, lastY : lastCellBeforeIntersectionY, intersects : intersectionObject, stepIterations:steps, nextX : nextXCoord, nextY : nextYCoord};
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