class TrekGame
{
    static ConstructFromJSData(jsData)
    {
        let gamerval = Object.create(TrekGame.prototype);
        Object.assign(gamerval, jsData);

        gamerval.enterprise = Object.create(Enterprise.prototype);
        Object.assign(gamerval.enterprise, jsData.enterprise);

        gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

        // console.log("galaxy map : " + gamerval.galaxyMap);

        gamerval.currentQuadrant = gamerval.galaxyMap.lookup(gamerval.enterprise.quadrantX, gamerval.enterprise.quadrantY);

        gamerval.currentQuadrant.quadrantEntities.push(gamerval.enterprise);

        return gamerval;
    }

    constructor()
    {
        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, TrekGame.EntityTypes);
        
        this.enterprise = new Enterprise();

        // start in a random quadrant
        this.enterprise.quadrantX = randomInt(0, mapWidthQuadrants - 1);
        this.enterprise.quadrantY = randomInt(0, mapHeightQuadrants - 1);
        this.enterprise.sectorX = 0;
        this.enterprise.sectorY = 0;
        
        this.currentQuadrant = this.galaxyMap.lookup(this.enterprise.quadrantX, this.enterprise.quadrantY);

        this.currentQuadrant.addEntity(this.enterprise);

        this.klingonsRemaining = Klingon.Instances;

        // pick a stardate between the start and end of TOS
        this.starDate = randomInt(1312, 5928);

        this.setInputPrompt(defaultInputPrompt);

        autosave(this);
    }

    changeToQuadrant(qX, qY)
    {
        this.currentQuadrant.removeEntity(this.enterprise);
        this.currentQuadrant = this.galaxyMap.lookup(qX, qY);
        this.enterprise.quadrantX = qX;
        this.enterprise.quadrantY = qY;
        this.currentQuadrant.quadrantEntities.push(this.enterprise);

        gameOutputAppend("Entering galactic quadrant " + this.enterprise.quadrantString());
    }

    currentStardate()
    {
        return this.starDate;
    }

    statusString()
    {
        return "<pre>" +
        "\n\n" + 
        "STARDATE           " + this.currentStardate() + '\n' +  
        "CONDITION          " + this.enterprise.conditionString() + '\n' + 
        "QUADRANT           " + (this.enterprise.quadrantX+1) +  ',' + (this.enterprise.quadrantY+1) + '\n' + 
        "SECTOR             " + (this.enterprise.sectorX+1) +  ',' + (this.enterprise.sectorY+1) + '\n' + 
        "PHOTON TORPEDOES   " + this.enterprise.torpedoes + '\n' + 
        "FREE ENERGY        " + this.enterprise.freeEnergy + '\n' + 
        "SHIELDS            " + this.enterprise.shields + '\n' + 
        "KLINGONS REMAINING " + this.klingonsRemaining + '\n' + 
        "</pre>";
    }

    setInputPrompt(newprompt)
    {
        document.getElementById("inputPrompt").innerHTML = newprompt;

    }

    shieldHandler(inputline)
    {
        let parsedVal = parseInt(inputline);

        if (isNaN(parsedVal) || parsedVal < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }
        if (parsedVal > (this.enterprise.shields + this.enterprise.freeEnergy))
        {
            gameOutputAppend("We don't have enough energy for that, captain!");
            return false;
        }
        
        //gameOutputAppend(""+parsedVal);

        this.enterprise.setShieldLevel(parsedVal);
        this.updateStatus();

        return true;
    }

    navigationHandler(inputline)
    {
        console.log("nav");
        let angle = parseInt(inputline);

        if ((angle == null) || isNaN(angle) || angle < 0 || angle > 360.0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput("Input warp factor (0-8).", 5, function(inputline){return this.navigationHandler2(inputline, angle)});
        return false;
    }

    navigationHandler2(inputline, angle)
    {
        console.log("nav2");
        let warpFactor = parseFloat(inputline);

        if ((warpFactor == null) || isNaN(warpFactor) || warpFactor < 0.0 || warpFactor > 8.0)
        {
            gameOutputAppend("Invalid value");
            return false;
        }

        console.assert(quadrantHeightSectors == quadrantWidthSectors);
        let warpFactorScale = quadrantHeightSectors;

        let sectorsToTravel = Math.round(warpFactorScale * warpFactor);

        if (sectorsToTravel < 1)
        {
            gameOutputAppend("Warp factor is too small to get anywhere!");
        }

        //console.log("Sectors to travel : "  + sectorsToTravel);

        //console.log("intersect test");

        this.enterprise.warp(sectorsToTravel, angle, this);

        //console.log("updating " + intersection.lastX + " " + intersection.lastY);
        this.updateStatus();
        updateMap();

        return true;
    }

    torpedoHandler(inputline)
    {
        let angle = parseInt(inputline);

        //console.log(""+angle);
        gameOutputAppend(""+angle);

        if ((angle == null) || isNaN(angle) || angle < 0 || angle > 360.0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.enterprise.fireTorpedo(this.currentQuadrant, angle);
        this.updateStatus();
        updateMap();
        return true;
    }

    phaserHandler(inputline)
    {
        let energy = parseInt(inputline);

        if ((energy == null) || isNaN(energy) || energy < 0)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        if (energy > this.enterprise.freeEnergy)
        {
            gameOutputAppend("Not enough energy, captain!");
            return false;
        }

        if (energy == 0)
        {
            return true;
        }

        this.enterprise.firePhasers(energy, this.currentQuadrant.getEntitiesOfType(Klingon), this.currentQuadrant);
        this.updateStatus();
        updateMap();
        
        return true;
    }

    endGameHandler(inputline)
    {
        if (inputline == 'Y' || inputline == 'y')
        {
            autosave(null);
            gameOutputAppend("Thanks for playing!  Refresh the page to play again.");
            this.disableInput();
            return false;
        }
        else if (inputline == 'n' || inputline == 'N')
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    updateStatus()
    {
        document.getElementById("status").innerHTML = this.statusString();
    }

    awaitInput(inputPrompt=defaultInputPrompt, charactersToRead=3, inputHandler=null)
    {
        document.getElementById("inputPrompt").style.display="Block";
        document.getElementById("gameInput").style.display="Block";
        document.getElementById("inputButton").style.display ="Block";

        this.inputHandler = inputHandler;
        document.getElementById("gameInput").maxLength = charactersToRead;
        this.setInputPrompt(inputPrompt);
    }

    disableInput()
    {
        document.getElementById("inputPrompt").style.display="None";
        document.getElementById("gameInput").style.display="None";
        document.getElementById("inputButton").style.display ="None";
    }

    gameInput(inputStr)
    {
        console.log(inputStr);
        //gameOutputAppend(inputStr);

        if (this.inputHandler)
        {
            if (this.inputHandler(inputStr))
            {
                this.awaitInput(defaultInputPrompt, 3, null);
            }

            autosave(this);
            return;
        }

        inputStr = inputStr.toLowerCase();

        if (inputStr == 'nav')
        {
            gameOutputAppend("Navigation");
            this.awaitInput("Enter heading (degrees).", 3, this.navigationHandler);
        }
        else if (inputStr == "lrs")
        {
            gameOutputAppend("Long Range Scan");
            document.getElementById("lrs").innerHTML = "<pre>" + this.enterprise.lrsString(this.galaxyMap) + "</pre>";
        }
        else if (inputStr == "pha")
        {
            gameOutputAppend("Fire phasers");
            if (this.currentQuadrant.countEntitiesOfType(Klingon))
            {
                gameOutputAppend("Enter the energy to commit to the phasers.");
                gameOutputAppend("Total available : " + this.enterprise.freeEnergy);
                this.awaitInput("Energy:", 4, this.phaserHandler);
            }
            else
            {
                gameOutputAppend("No enemies detected in this Quadrant, captain.");
            }
        }
        else if (inputStr == "tor")
        {
            gameOutputAppend("Fire torpedoes");
            if (this.enterprise.torpedoes > 0)
            {
                gameOutputAppend("Enter torpedo heading (in degrees)");
                this.awaitInput("Torpedo Heading (degrees)", 3, this.torpedoHandler);
            }
            else
            {
                gameOutputAppend("We're out of torpedoes, captain!");
            }
        }
        else if (inputStr == "she")
        {
            gameOutputAppend("Configure shields");
            gameOutputAppend("Enter the new energy level for the shields.");
            gameOutputAppend("Total available is : " + (this.enterprise.freeEnergy + this.enterprise.shields));
            
            this.awaitInput("New shield level:", 4, this.shieldHandler);
        }
        else if (inputStr == "xxx")
        {
            gameOutputAppend("Resign command");
            this.awaitInput("Are you sure you want to end your current game and erase your autosave? (Y/N)", 1, this.endGameHandler);
            return;
        }
        else
        {
            gameOutputAppend("Come again, captain?")
        }

        autosave(this);
    }
}

TrekGame.EntityTypes = [Star, StarBase, Klingon];

function createEntityMap(entityList)
{
    var map = new Map();
    var x;
    for (x in entityList)
    {
        let etype = entityList[x];
        map.set(etype.name, etype);
    }
    return map;
}

const EntityMap = createEntityMap(TrekGame.EntityTypes);

console.log("Hope you enjoy the game!");