class Quadrant
{
    constructor(widthSectorsIn, heightSectorsIn)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        this.width = widthSectorsIn;
        this.height = heightSectorsIn;
        this.quadrantEntities = new Array();
    }

    populateFromJSData(entitiesQuadrantJS)
    {
        var x;
        for (x in entitiesQuadrantJS.quadrantEntities)
        {
            let entData = entitiesQuadrantJS.quadrantEntities[x];

            // we construct and insert the enterprise entity elsewhere.
            if (entData.entityType != "Enterprise")
            {
                let ctype = EntityMap.get(entData.entityType);

                let entityObj = new ctype(); 
                Object.assign(entityObj, entData);

                this.quadrantEntities.push(entityObj);
            }
        }
    }

    removeEntity(entity)
    {
        let rmindex = this.quadrantEntities.indexOf(entity);
        if (rmindex == -1)throw "Entity not found";
        this.quadrantEntities.splice( rmindex, 1 );
    }

    entityAtLocation(nextXCoord, nextYCoord)
    {
        nextXCoord = Math.floor(nextXCoord);
        nextYCoord = Math.floor(nextYCoord);
        
        for (var x in this.quadrantEntities)
        {
            let objTest = this.quadrantEntities[x];

            if ((objTest.sectorX == nextXCoord) && (objTest.sectorY == nextYCoord))
            {
                return objTest;
            }
        }

        return null;
    }

    // return a tuple containing
    // the last sector prior to the intersection
    // and the intersection object (null if none)
    intersectionTest(sectorX, sectorY, angleDegrees, maxSectorsToTravel = Number.MAX_VALUE)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        // console.log(""+angleDegrees);

        // take angle in degrees to radians, then create a vector
        // start from 360 CCW because we have a top left origin (y axis goes down) internally
        // instead of y axis goes up like in your math textbook
        let angle = 360.0 - angleDegrees

        let radians = angle * Math.PI / 180.0;

        // polar to euclidean coordinates
        let xVec = Math.cos(radians);
        let yVec = Math.sin(radians);

        // we'll step through the grid in in increments of one cell; -1 if the x / y direction are negative
        let xNextF = xVec > 0.0 ? 1.0 : -1.0;
        let yNextF = yVec > 0.0 ? 1.0 : -1.0;

        // start in the middle of the cell.
        let startCoordX = Math.floor(sectorX) + .5;
        let startCoordY = Math.floor(sectorY) + .5;

        // return values
        let lastCellBeforeIntersectionX = startCoordX;
        let lastCellBeforeIntersectionY = startCoordY;
        let intersectionObject = null;

        //console.log("start coord " + (startCoordX) + " " + (startCoordY));
        //console.log("vec " + (xVec) + " " + (yVec));

        var nextXCoord = 0;
        var nextYCoord = 0;

        var steps = 0;
        while (steps < maxSectorsToTravel)
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

            let tXBound = (nextXCoord - lastCellBeforeIntersectionX) / xVec;
            let tYBound = (nextYCoord - lastCellBeforeIntersectionY) / yVec;

            tXBound = Math.abs(xVec) > .00001 ?  tXBound : Number.MAX_VALUE;
            tYBound = Math.abs(yVec) > .00001 ?  tYBound : Number.MAX_VALUE;

            var currentT = 0.0;
            if (tXBound < tYBound)
            {
                //console.log("xb " + tXBound);
                nextYCoord = lastCellBeforeIntersectionY + yVec * tXBound;
            }
            else
            {
                //console.log("yb");
                nextXCoord = lastCellBeforeIntersectionX + xVec * tYBound;
            }

            intersectionObject = this.entityAtLocation(nextXCoord, nextYCoord);

            if (intersectionObject != null)
            {
                //console.log("intersection return");
                break;
            }

            if (nextXCoord < 0 || nextXCoord >= quadrantWidthSectors || nextYCoord < 0 || nextYCoord >= quadrantHeightSectors)
            {
                //console.log("next out of bounds " + nextXCoord + " " + nextYCoord);
                break;
            }

            lastCellBeforeIntersectionX = nextXCoord;
            lastCellBeforeIntersectionY = nextYCoord;

            steps++;

            //console.log("cell step" + (1+lastCellBeforeIntersectionX) + " " + (1+lastCellBeforeIntersectionY));
        }

        //console.log("cell end " + (1+lastCellBeforeIntersectionX) + " " + (1+lastCellBeforeIntersectionY)+ " " + intersectionObject);
        return {lastX : lastCellBeforeIntersectionX, lastY : lastCellBeforeIntersectionY, intersects : intersectionObject, stepIterations:steps, nextX : nextXCoord, nextY : nextYCoord};
    }

    countEntitiesOfType(classtype)
    {
        var rval=0;
        for (var x in this.quadrantEntities)
        {
            if (this.quadrantEntities[x].constructor == classtype)
            {
                rval++;
            }
        }
        return rval;
    }

    getEntitiesOfType(classtype)
    {
        return this.quadrantEntities.filter(function(item){return item.constructor == classtype});
    }

    klingonsFire(target)
    {
        let klist = this.getEntitiesOfType(Klingon);

        for (var x in klist)
        {
            klist[x].firePhasers(target);
        }
    }

    createEntities(entityTypes)
    {
        var entityIdx;
        for (entityIdx in entityTypes)
        {
            let entityType = entityTypes[entityIdx];

            let numEntities = entityType.randomCountForQuadrant(this.emptySquares());
            console.log("Generating " + numEntities + entityType.name);

            for (let i =0; i < numEntities; i++ )
            {
                this.addEntityInFreeSector(new entityType());
            }
        }
    }

    addEntityInFreeSector(entity)
    {
        entity.setLocationSector(this.getEmptySquare());
        this.quadrantEntities.push(entity);
    }

    addEntity(entity)
    {
        this.quadrantEntities.push(entity);
    }

    emptySquares()
    {
        return this.width*this.height - this.quadrantEntities.length;
    }

    getEmptySquare()
    {
        console.assert(this.width * this.height > this.quadrantEntities.length);

        if (this.quadrantEntities.length >= this.width*this.height)
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
            for (entityIdx in this.quadrantEntities)
            {
                let entity = this.quadrantEntities[entityIdx];
                if (entity.sectorX == randomX && entity.sectorY == randomY)
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
        let borderStringPost = "  -1---2---3---4---5---6---7---8--\n";
        let borderStringPre = "  =---=---=---=---=---=---=---=---\n";

        let quadrantStringGrid = new Grid(this.width, this.height, function(){return " ".padStart(sectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in this.quadrantEntities)
        {
            let gameObject = this.quadrantEntities[gameObjectIndex];
            let objStr = gameObject.toString().padStart(sectorDisplayWidthChars, ' ');
            quadrantStringGrid.setValue(gameObject.sectorX, gameObject.sectorY, objStr);
        }

        let mapString = quadrantStringGrid.toString();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";
    }
}