class SensorHistory extends Grid
{
    constructor()
    {
        super( mapWidthQuadrants, mapHeightQuadrants, function(){return {};} );
    }

    updateSensorHistory(EntityType, galaxyMap, startLocX, startLocY, endLocX, endLocY)
    {
        for (var y = startLocY; y <= endLocY; y++)
        {
            for (var x = startLocX; x <= endLocX; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);

                if (quadrant)
                {
                    let ct = quadrant.countEntitiesOfType(EntityType);
                    this.lookup(x, y)[EntityType] = ct;
                }
            }
        }               
    }

    updateSensorHistoryForEntityTypes(EntityList, galaxyMap, startLocX, startLocY, endLocX, endLocY)
    {
        for (var x in EntityList)
        {
            let EntityType = EntityList[x];
            this.updateSensorHistory(EntityType, galaxyMap, startLocX, startLocY, endLocX, endLocY);
        }
    }

    mapString(EntityType = Klingon, gameobject = null)
    {
        let header = "   ";
        for (let x = 0; x < mapWidthQuadrants; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "------";
        border = border.repeat(mapWidthQuadrants);
        let rval = header + "\n   " + border + '\n';

        for (let y = 0; y < this.height; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = 0; x < this.width; x++)
            {
                let quadrantDict = this.lookup(x, y);
                
                if (quadrantDict)
                {    
                    var k = "";

                    if (EntityType in quadrantDict)
                    {
                        k += quadrantDict[EntityType]; // integer count of the entity type
                    }
                    else
                    {
                        k += "?";
                    }

                    if (gameobject)
                    {
                        if (gameobject.quadrantX == x && gameobject.quadrantY == y)
                        {
                            // put an "E" on the map for the enterprise's current location
                            k += 'E';
                        }
                    }

                    rval += " " + padStringToLength(""+k, 3, ' ') + " |";
                }
                else
                {  console.log(" null");
                    rval += " *** |";
                }
             }
             rval += "\n   " + border + "\n";
         }
         return rval;
     }
}