class GalaxyMap extends Grid
{
    constructor(sectorsX, sectorsY, entityTypes)
    {
        checkArgumentsDefinedAndHaveValue(arguments);
        super(sectorsX, sectorsY, function(x, y){return new Sector(sectorWidthSubsectors,sectorHeightSubsectors, x, y)});

        this.createMinimumInstances(entityTypes, sectorsX, sectorsY);

        for (let i = 0; i < sectorsX*sectorsY; i++)
        {
            this.lookup1D(i).createEntities(entityTypes);
        }
    }

    static ConstructFromJSData(jsData)
    {
        let rval = new GalaxyMap(mapWidthSectors, mapHeightSectors, []);

        var x;
        for (x in jsData.contents)
        {
            let entitiesSectorJS = jsData.contents[x];

            rval.contents[x].populateFromJSData(entitiesSectorJS);
        }

        return rval;
    }

    mapString(galaxyMap, EntityType = Klingon, gameobject = null)
    {
        let header = "   ";
        for (let x = 0; x < mapWidthSectors; x++)
        {
            header += padStringToLength((""+(x+1)), 6);
        }

        let border = "------";
        border = border.repeat(mapWidthSectors);
        let rval = header + "\n   " + border + '\n';

        for (let y = 0; y < mapHeightSectors; y++)
        {
            rval += " " + (y+1) + " |";
            for (let x = 0; x < mapWidthSectors; x++)
            {
                let sector = galaxyMap.lookup(x, y);
                
                if (sector)
                {    
                    let k = sector.countEntitiesOfType(EntityType);

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

    createMinimumInstances(entityTypes)
    {
        var x;
        for (x in entityTypes)
        {
            let etype = entityTypes[x];

            let instancesToCreate = etype.minInstancesGame() ;//- etype.Instances;

            // console.log("Creating min instances of " + etype.name + " : " + instancesToCreate);
            if (instancesToCreate > 0)
            {
                for (let i = 0; i < instancesToCreate; i++)
                {
                    let inst = new etype();
                    let randomSector = randomInt(0, this.contents.length-1);

                    let instAssigned = false;
                    for (let quad = 0; quad < this.contents.length; quad++)
                    {
                        if (this.lookup1D(randomSector).emptySquares())
                        {
                            this.lookup1D(randomSector).addEntityInFreeSubsector(inst);
                            instAssigned = true;
                            break;
                        }

                        randomSector = (randomSector + 1 ) % this.contents.length;
                    }
                    
                    if (!instAssigned)
                    {
                        throw "Not enough space to assign minumum instances of " + etype.name;
                    }
                }
            }
        }
    }
}