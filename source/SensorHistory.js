class SensorHistory extends Grid
{
    constructor()
    {
        super( mapWidthQuadrants, mapHeightQuadrants, function(){return {};} );
    }

    updateSensorHistory(EntityType, galaxyMap, startLocX, startLocY, endLocX, endLocY)
    {
        console.log("updating sensory history for " + EntityType);
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

    // long range scan
    mapString(EntityType = Klingon, gameobject = null)
    {
        let border = "---------------------------------------------------------";
        let rval = border + '\n';

        for (let y = -1; y <= this.height; y++)
        {
            rval += "|";
            for (let x = -1; x <= this.width; x++)
            {
                let quadrantDict = this.lookup(x, y);
                
                if (quadrantDict)
                {
                    console.log("not null");
                     
                    // klingons, starbases, stars
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
             rval += "\n" + border + "\n";
         }
         return rval;
     }
}