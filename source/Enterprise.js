class ShipComponent
{
    constructor (componentName, damProb)
    {
        this.componentHealth = 1.0; //percent
        this.componentName = componentName;
        this.componentDamageProbability = damProb
    }
}

class Enterprise extends GameObject
{
    componentDamageProbabilities()
    {
        var probArray = [];

        for (var key in this.components)
        {
            probArray.push(this.components[key].componentDamageProbability);
        }

        console.assert(probArray.length == this.components.length);
        return probArray;
    }

    constructor()
    {
        super(Enterprise);
        this.torpedoes = Enterprise.StartTorpedoes;
        this.shields = Enterprise.StartShields;

        this.freeEnergy = Enterprise.StartEnergy;

        this.components =   {
                                WarpEngines : new ShipComponent("Warp Engines", .0625), 
                                ShortRangeSensors: new ShipComponent("Short Range Sensors", .0625),
                                LongRangeSensors: new ShipComponent("Long Range Sensors", .25),
                                PhaserControl : new ShipComponent("Phaser Control", .0625),
                                PhotonTubes : new ShipComponent("Photon Tubes", .125),
                                DamageControl : new ShipComponent("Damage Control", .0625),
                                ShieldControl : new ShipComponent("Shield Control", .125), 
                                LibraryComputer : new ShipComponent("Library Computer", .25)
                            }

        this.hitNoShields = false;
    }

    // is our total energy less than the minimum energy cost to get anywhere?
    isStranded()
    {
        return (this.freeEnergy + this.shields) < this.warpEnergyCost(1); // energy cost to travel one square.
    }

    isDestroyed()
    {
        return this.hitNoShields;
    }

    warpEnergyCost(numSectors)
    {
        return Enterprise.EnergyCostPerSector * numSectors;
    }
    
    // assumes that the input value has been previously checked for the appropriate range and available value
    setShieldLevel(newShields)
    {
        if ((newShields > this.freeEnergy + this.shields) || newShields < 0.0)
        {
            throw "Invalid value for shield level"; 
        }

        this.freeEnergy += this.shields - newShields;
        this.shields = newShields;
    }

    toString()
    {
        return "<*>";
    }

    static maxInstancesGame()
    {
        return 1;
    }

    static maxInstancesQuadrant()
    {
        return 1;
    }

    static minInstancesGame()
    {
        return 1;
    }

    conditionString(game)
    {
        if (game.currentQuadrant.countEntitiesOfType(Klingon))
        {
            return "RED";
        }

        if ((this.freeEnergy + this.shields) < .1 * Enterprise.StartEnergy)
        {
            return "YELLOW";
        }

        return "GREEN";
    }

    onPhaserHit(energy, game)
    {

    }

    firePhasers(energy, game)
    {
        console.log("fire phasers");

        let targets = [];

        var x;
        for (x in Enterprise.PhaserTargets)
        {
            targets.push(...game.currentQuadrant.getEntitiesOfType(Enterprise.PhaserTargets[x]));
        }

        console.assert(energy <= this.freeEnergy);

        this.freeEnergy -= energy;

        gameOutputAppend("Firing phasers at " + targets.length + " targets.");
        console.assert(targets.length > 0);
        let damagePerTarget = energy / targets.length;

        var x;
        for (x in targets)
        {
            console.log("target");
            let target = targets[x];
            let dist = this.distanceToObject(target);

            let damageAttenuated = damagePerTarget / dist;
            let damageFinal = Math.floor(randomFloat(2.0, 3.0) * damageAttenuated);

            target.onPhaserHit(damageFinal, game);
        }
    }

    fireTorpedo(game, angle)
    {
        if (this.freeEnergy >= Enterprise.TorpedoEnergyCost)
        {
            let torpedoIntersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, angle);
            this.torpedoes--;
            this.freeEnergy -= Enterprise.TorpedoEnergyCost;
            
            if (torpedoIntersection.intersects != null)
            {
               torpedoIntersection.intersects.onTorpedoHit(game);
            }
            else
            {
                gameOutputAppend("The torpedo missed!");
            }
        }
        else
        {
            //not enough energy
            gameOutputAppend("Not enough energy to fire torpedoes!");
        }
    }

    // long range scan
    lrsString(galaxyMap)
    {
        let border = "-------------------";
        let rval = border + '\n';

        for (let y = this.quadrantY - 1; y <= this.quadrantY + 1; y++)
        {
            rval += "|";
            for (let x = this.quadrantX - 1; x <= this.quadrantX + 1; x++)
            {
                let quadrant = galaxyMap.lookup(x, y);
                if (quadrant)
                {
                    // klingons, starbases, stars
                    let k = quadrant.countEntitiesOfType(Klingon);
                    let s = quadrant.countEntitiesOfType(StarBase);
                    let st = quadrant.countEntitiesOfType(Star);

                    rval += " " + k + s + st + " |";
                }
                else
                {
                    rval += " *** |";
                }
            }
            rval += "\n" + border + "\n";
        }
        return rval;
    }

    warp(sectorsToTravel, angle, game)
    {
        let energyRequired = this.warpEnergyCost(sectorsToTravel);

        if (this.freeEnergy < energyRequired)
        {
            gameOutputAppend("Not enough energy free to complete maneuver!");
            return;
        }

        var maxSectorsToTravel = sectorsToTravel;

        // do an intersection test of the enterprise against the map, in the direction of warp.
        // update the enterprise position to the last valid sector square along the warp vector
        // if we have an obstacle ahead we're done.
        // if we have no squares left to travel we're done.
        // if we have squares left to travel and the way ahead is clear, we need to go to the next sector.
        // but the first square along our line might be obstructed.  so we'll test that before changing sectors.
        while (sectorsToTravel > 0)
        {
            let intersection = game.currentQuadrant.intersectionTest(this.sectorX, this.sectorY, angle, sectorsToTravel);
           
            this.sectorX = Math.floor(intersection.lastX);
            this.sectorY = Math.floor(intersection.lastY);

            sectorsToTravel -= intersection.stepIterations

            if (intersection.intersects != null)
            {
                gameOutputAppend("Obstruction ahead.  Exiting warp.");
                break;
            }

            if (sectorsToTravel <= 0.0)
            {
                break;
            }

            // if we get here that means we've gone out of bounds for the quadrant

            var sectorXNext = this.sectorX;
            var sectorYNext = this.sectorY;
            var quadrantXNext = this.quadrantX;
            var quadrantYNext = this.quadrantY;

            if (intersection.nextX < 0)
            {
                quadrantXNext = this.quadrantX - 1;
                sectorXNext = quadrantWidthSectors - 1;
            }
            if (intersection.nextX >= quadrantWidthSectors)
            {
                quadrantXNext = this.quadrantX + 1;
                sectorXNext = 0;
            }
            if (intersection.nextY < 0)
            {
                quadrantYNext = this.quadrantY - 1;
                sectorYNext = quadrantWidthSectors - 1;
            }
            if (intersection.nextY >= quadrantHeightSectors)
            {
                quadrantYNext = this.quadrantY + 1;
                sectorYNext = 0;
            }

            // we should see SOME change in quadrant.  assert check.
            console.assert((this.quadrantX != quadrantXNext) || (this.quadrantY != quadrantYNext));

            var nextQuadrantValid = (quadrantXNext >= 0.0) && (quadrantXNext < mapWidthQuadrants) && (quadrantYNext >= 0.0) && (quadrantYNext < mapHeightQuadrants);

            if (nextQuadrantValid)
            {
                var nextQuadrantTest = game.galaxyMap.lookup(quadrantXNext, quadrantYNext);

                var startSquareFree = nextQuadrantTest.entityAtLocation(sectorXNext, sectorYNext) == null;

                if (startSquareFree)
                {
                    this.sectorX = sectorXNext;
                    this.sectorY = sectorYNext;
                    sectorsToTravel -= 1.0;

                    game.changeToQuadrant(quadrantXNext, quadrantYNext);
                }
                else
                {
                    gameOutputAppend("Obstruction in sector " + (sectorXNext+1) + ", " + (sectorYNext+1) + " of quadrant " + (quadrantXNext+1) + ", " + (quadrantYNext+1) );
                    gameOutputAppend("Exiting warp.");
                    break;
                }
            }
            else
            {
                gameOutputAppend("You are not authorized by Starfleet to cross the galactic perimeter.  Shutting down warp engines.");
                break;
            }
        }

        let actualEnergy = this.warpEnergyCost(maxSectorsToTravel - sectorsToTravel);

        // get the energy cost of the sectors we actually travelled
        this.freeEnergy -= actualEnergy
    }
}

Enterprise.StartTorpedoes = 10;
Enterprise.StartEnergy = 3000;
Enterprise.StartShields = 0;
Enterprise.TorpedoEnergyCost = 2;
Enterprise.PhaserTargets = [Klingon]; // future extension : this list could be dynamic based on evolving gameplay alliances, etc :) 
Enterprise.SRSFullyFunctionalHealth = .7;
Enterprise.SRSMinChanceCorrupt = .1;
Enterprise.SRSMaxChanceCorrupt = .75;
Enterprise.EnergyCostPerSector = 1.0;