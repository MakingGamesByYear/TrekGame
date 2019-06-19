class TrekGame
{
    static ConstructFromJSData(jsData)
    {
        try
        {
            let gamerval = Object.create(TrekGame.prototype);
            Object.assign(gamerval, jsData);

            gamerval.enterprise = Object.create(Enterprise.prototype);
            Object.assign(gamerval.enterprise, jsData.enterprise);

            gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

            // console.log("galaxy map : " + gamerval.galaxyMap);

            gamerval.currentQuadrant = gamerval.galaxyMap.lookup(gamerval.enterprise.quadrantX, gamerval.enterprise.quadrantY);

            gamerval.currentQuadrant.addEntity(gamerval.enterprise);

            gamerval.createMenus();

            gamerval.setInputPrompt(gamerval.mainMenu.toString());

            gamerval.updateStatus();
            updateMap(gamerval.updateMapScreen());
            return gamerval;
        }
        catch(err)
        {
            console.log("Corrupt save file.  Erasing.");
            autosave(null);
            gameOutputAppend("Corrupt save file.  Refresh page to start new game.");
        }
    }

    constructor()
    {
        this.gameOver = false;

        this.galaxyMap = new GalaxyMap(mapWidthQuadrants, mapHeightQuadrants, TrekGame.EntityTypes);
        
        this.enterprise = new Enterprise();

        // start in a random quadrant
        this.enterprise.quadrantX = randomInt(0, mapWidthQuadrants - 1);
        this.enterprise.quadrantY = randomInt(0, mapHeightQuadrants - 1);
        this.enterprise.sectorX = 0;
        this.enterprise.sectorY = 0;
        
        this.currentQuadrant = this.galaxyMap.lookup(this.enterprise.quadrantX, this.enterprise.quadrantY);

        this.currentQuadrant.addEntityInFreeSector(this.enterprise);

        // pick a stardate between the start and end of TOS
        this.starDate = randomInt(1312, 5928);
        this.endStarDate = this.starDate + TrekGame.BaseMissionTime + randomInt(0, TrekGame.MissionTimeSpread);

        this.createMenus();
        this.setInputPrompt(this.mainMenu.toString());

        this.updateStatus();
        updateMap(this.updateMapScreen());

        autosave(this);

        this.printStory();
    }

    printStory()
    {
        var storyString = "The stardate is " + this.starDate + ".\n\nYou are the captain of the USS Enterprise.  " +
        "You have received word from Starfleet command of a plot by Klingon spies to destroy all the Federation " +
        "starbases in the region so the Klingon Empire can assume control.\n\n";

        storyString += 
        "The Federation is in danger and you are the only ship in range.\n\n"

        storyString+= 
        "Your mission is to hunt down and destroy the " + Klingon.Instances + " Klingon warships in the region.\n" + 
        "You must complete your mission before stardate " + this.endStarDate + ", giving you " + (this.endStarDate - this.starDate) + 
        " stardates to succeed.";

        storyString += 
        "\n\nThere are " + StarBase.Instances + " Federation Starbases in the region for refueling, restocking torpedoes, and repairs.";

        storyString += "\n\nGood luck, galactic peace is in your hands!";

        gameOutputAppend(storyString);
    }

    changeToQuadrant(qX, qY)
    {
        this.currentQuadrant.removeEntity(this.enterprise);
        this.currentQuadrant = this.galaxyMap.lookup(qX, qY);
        this.enterprise.quadrantX = qX;
        this.enterprise.quadrantY = qY;
        this.currentQuadrant.addEntity(this.enterprise);

        gameOutputAppend("Entering galactic sector " + this.enterprise.quadrantString());
    }

    statusString()
    {
        return "<pre>" +
        "\n\n" + 
        "STARDATE           " + this.starDate + '\n' +  
        "CONDITION          " + this.enterprise.conditionString(this) + '\n' + 
        "SECTOR             " + (this.enterprise.quadrantX+1) +  ',' + (this.enterprise.quadrantY+1) + '\n' + 
        "SUBSECTOR          " + (this.enterprise.sectorX+1) +  ',' + (this.enterprise.sectorY+1) + '\n' + 
        "PHOTON TORPEDOES   " + this.enterprise.torpedoes + '\n' + 
        "FREE ENERGY        " + this.enterprise.freeEnergy + '\n' + 
        "SHIELDS            " + this.enterprise.shields + '\n' + 
        "KLINGONS REMAINING " + Klingon.Instances + '\n' + 
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

        this.currentQuadrant.klingonsFire(this.enterprise, this);

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
            return true;
        }

        this.enterprise.warp(sectorsToTravel, angle, this);

        this.currentQuadrant.klingonsFire(this.enterprise, this);

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

        this.enterprise.fireTorpedo(this, angle);

        this.currentQuadrant.klingonsFire(this.enterprise, this);

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

        this.enterprise.firePhasers(energy, this);

        this.currentQuadrant.klingonsFire(this.enterprise, this);
        
        return true;
    }

    endGameHandler(inputline)
    {
        if (inputline == 'Y' || inputline == 'y')
        {
            this.endGame();
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

    awaitInput(inputPrompt, charactersToRead=3, inputHandler=null)
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

    handleInput(inputStr)
    {
        gameOutputAppend("\n> "+inputStr+"\n");
        if (this.inputHandler)
        {
            if (this.inputHandler(inputStr))
            {
                this.awaitInput(this.mainMenu.toString(), 3, null);
            }
        }
        else
        {
            if (!this.mainMenu.chooseOption(inputStr))
            {
                gameOutputAppend("Come again, captain?")
            }
        }
    }

    gameInput(inputStr)
    {
        //console.log(">"+inputStr+"\n");
        //gameOutputAppend(inputStr);

        this.handleInput(inputStr);

        this.updateGame();
    }

    updateGame()
    {
        this.updateStatus();
        updateMap(this.updateMapScreen());
        autosave(this);

        this.checkEndConditions();
    }

    endGame()
    {
        this.gameOver = true;
        autosave(null);
        gameOutputAppend("Thanks for playing!  Refresh the page to play again.");
        this.disableInput();
    }

    checkEndConditions()
    {
        if (this.gameOver) return;

        if (this.starDate > this.endStarDate)
        {
            gameOutputAppend("You were unable to complete your mission in time.");
            gameOutputAppend("The Klingons were able to execute their plan to destroy the Federation starbases!");
            gameOutputAppend("You'll be demoted for sure!");

            this.endGame();
        }
        else if (this.enterprise.isStranded())
        {
            gameOutputAppend("You have insufficient energy to power the warp engines!");
            gameOutputAppend("You are stranded, causing you to ultimately fail your mission.");
            
            this.endGame();
        }
        else if (this.enterprise.isDestroyed())
        {
            gameOutputAppend("Your vessel has taken too much damage and has been destroyed.");
            gameOutputAppend("Your mission is failed.");

            this.endGame();
        }
        else if (!StarBase.Instances)
        {
            gameOutputAppend("All the Federation starbases have been destroyed!");
            gameOutputAppend("You've failed in your mission.  The Federation is doomed.");

            this.endGame();
        }
        else if (!Klingon.Instances)
        {
            gameOutputAppend("You've managed to destroy all the enemy vessels, preventing the enemy from executing their plan!");
            gameOutputAppend("You're sure to get a promotion!");
            gameOutputAppend("Congratulations on your victory!");
            
            this.endGame();
        }
    }
    
    createMenus()
    {
        this.mainMenu = new MainMenu(this);
        this.computerMenu = new ShipComputerMenu(this);
    }

    updateMapScreen()
    {
        let quad = this.currentQuadrant;

        let borderStringPost = "   " + mapFooter(quadrantWidthSectors);
        let borderStringPre = "   " + mapHeader(quadrantWidthSectors) + '\n';

        let quadrantStringGrid = new Grid(quad.width, quad.height, function(){return " ".padStart(sectorDisplayWidthChars, ' ')})

        var gameObjectIndex;
        for (gameObjectIndex in quad.quadrantEntities)
        {
            let gameObject = quad.quadrantEntities[gameObjectIndex];
            var objStr;
        
            objStr = gameObject.toString().padStart(sectorDisplayWidthChars, ' ');

            quadrantStringGrid.setValue(gameObject.sectorX, gameObject.sectorY, objStr);
        }

        let healthOK = this.enterprise.components.ShortRangeSensors.componentHealth > Enterprise.SRSFullyFunctionalHealth;

        if (!healthOK)
        {
            // goes from 0 when the component is at the maximum health in range, to 1 when the component is at 0%
            let hnorm = (Enterprise.SRSFullyFunctionalHealth - this.enterprise.components.ShortRangeSensors.componentHealth) / Enterprise.SRSFullyFunctionalHealth;

            // lerp
            let chanceCorrupt = (1.0 - hnorm) * Enterprise.SRSMinChanceCorrupt + hnorm * Enterprise.SRSMaxChanceCorrupt;

            // randomly go through and corrupt the short range scan based on the health of the ship components
            for (var x in quadrantStringGrid.contents)
            {
                let corrupt = Math.random() < chanceCorrupt;
                
                if (corrupt)
                {
                    quadrantStringGrid.setValue1D(x, '?'.padStart(sectorDisplayWidthChars, ' '));
                }
            }
        }

        let mapString = quadrantStringGrid.toString();

        return "<pre>" + borderStringPre + mapString + borderStringPost + "</pre>";

    }
}

TrekGame.EntityTypes = [Star, StarBase, Klingon];
TrekGame.BaseMissionTime = 25;
TrekGame.MissionTimeSpread = 10;

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