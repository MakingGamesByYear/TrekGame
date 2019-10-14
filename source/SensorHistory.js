class SensorHistory extends Grid
{
    constructor()
    {
        super( mapWidthSectors, mapHeightSectors, function(){return {};} );
    }

    updateSensorHistory(EntityType, galaxyMap, startLocX, startLocY, endLocX, endLocY)
    {
        for (var y = startLocY; y <= endLocY; y++)
        {
            for (var x = startLocX; x <= endLocX; x++)
            {
                let sector = galaxyMap.lookup(x, y);

                if (sector)
                {
                    let ct = sector.countEntitiesOfType(EntityType);
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
        for (let x = 0; x < mapWidthSectors; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "------";
        border = border.repeat(mapWidthSectors);
        let rval = header + "\n   " + border + '\n';

        for (let y = 0; y < this.height; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = 0; x < this.width; x++)
            {
                let sectorDict = this.lookup(x, y);
                
                if (sectorDict)
                {    
                    var k = "";

                    if (EntityType in sector)
                    {
                        k += sectorDict[EntityType]; // integer count of the entity type
                    }
                    else
                    {
                        k += "?";
                    }

                    if (gameobject)
                    {
                        if (gameobject.sectorX == x && gameobject.sectorY == y)
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