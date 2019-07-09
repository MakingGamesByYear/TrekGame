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

            gamerval.enterprise.sensorHistory = new SensorHistory();// Object.create(SensorHistory);
            Object.assign(gamerval.enterprise.sensorHistory, jsData.enterprise.sensorHistory);

            gamerval.galaxyMap = GalaxyMap.ConstructFromJSData(jsData.galaxyMap);

            // console.log("galaxy map : " + gamerval.galaxyMap);

            gamerval.currentQuadrant = gamerval.galaxyMap.lookup(gamerval.enterprise.quadrantX, gamerval.enterprise.quadrantY);

            gamerval.currentQuadrant.addEntity(gamerval.enterprise);

            gamerval.createMenus();

            gamerval.checkStarbaseDock();

            if (gamerval.enterprise.dockStarbase)
            {
                gamerval.showDockMenu();
            }
            else
            {
                gamerval.setInputPrompt(gamerval.mainMenu.toString());
            }

            gamerval.updateDisplay();
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
        this.starDateBegin = this.starDate;
        this.endStarDate = this.starDate + TrekGame.BaseMissionTime + randomInt(0, TrekGame.MissionTimeSpread);

        this.createMenus();
        this.setInputPrompt(this.mainMenu.toString());

        this.updateGame();

        this.printStory();

        autosave(this);
    }

    showDockMenu(sb)
    {
        let dockMenu = new Menu();
        let trekgame = this;

        dockMenu.options.push
        (
            new MenuOption
            (
                "1",
                ") ", 
                "STAY DOCKED (1 STARDATE, REPAIRS A COMPONENT)",
                function()
                {
                    trekgame.advanceStardate(1.0);
                    trekgame.enterprise.repairRandomComponent();
                    return false;
                }
            ),
            new MenuOption
            (
                "2",
                ") ",
                "UNDOCK",
                function()
                {
                    trekgame.enterprise.undock(sb);
                    gameOutputAppend("Undocking from starbase");

                    // explicitly doesn't take a stardate to do this action.

                    return true;
                }
            ),
            new MenuOption
            (
                "3", ") ", "DAMAGE REPORT", 
                function()
                {
                    trekgame.enterprise.damageReport();
                    return false;
                }
            ),
        );

        this.awaitInput
        (
            dockMenu.toString(),
            1,
            function(inputline){return dockMenu.chooseOption(inputline);}
        );
    }

    starbasesScan()
    {
        var sh = this.enterprise.sensorHistory;

        for (var x in StarBase.starbaseList)
        {
            let starbase = StarBase.starbaseList[x];
            sh.updateSensorHistoryForEntityTypes
            (
                [Star, Klingon], 
                this.galaxyMap, 
                starbase.quadrantX-1, 
                starbase.quadrantY-1, 
                starbase.quadrantX+1, 
                starbase.quadrantY+1
            );
        }
    }
    
    generateScore(gameWon)
    {
        let baseScore = 1000 * (Klingon.InstancesDestroyed / (1 + this.starDate - this.starDateBegin));
        let winMultiplier = 2.0;

        return gameWon ? Math.round(winMultiplier * baseScore) : Math.round(baseScore);
    }

    destroyKlingon(k)
    {
        gameOutputAppend("Klingon Fighter Destroyed");
        this.currentQuadrant.removeEntity(k);
        Klingon.Instances--;
        Klingon.InstancesDestroyed++;
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
        this.currentQuadrant.addEntityInFreeSector(this.enterprise);

        gameOutputAppend("Entering galactic sector " + this.enterprise.quadrantString());
    }

    statusString()
    {
        return "<pre>" +
        "\n\n\n" + 
        "STARDATES REMAINING   " + (this.endStarDate - this.starDate) +"\n" +
        "SECTOR                " + (this.enterprise.quadrantX+1) +  ',' + (this.enterprise.quadrantY+1) + '\n' + 
        "SUBSECTOR             " + (this.enterprise.sectorX+1) +  ',' + (this.enterprise.sectorY+1) + "\n" + 
        "PHOTON TORPEDOES      " + this.enterprise.torpedoes + '\n' + 
        "SHIELD ENERGY         " + this.enterprise.shields + '\n' + 
        "FREE ENERGY           " + this.enterprise.freeEnergy + '\n' + 
        "KLINGONS REMAINING    " + Klingon.Instances + '\n' + 
        "STARBASES REMAINING   " + StarBase.Instances + '\n' +
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

    navigationHandlerLongRangeX(inputline)
    {
        console.log("nav");
        let quadrantX = parseInt(inputline) - 1;

        if ((quadrantX == null) || isNaN(quadrantX) || quadrantX < 0 || quadrantX >= mapWidthQuadrants)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput(
            "Enter destination sector Y coordinate.  Enter a value between 1 and " + mapHeightQuadrants,
            2, 
            
            function(inputline)
            {
                return this.navigationHandlerLongRangeY(inputline, quadrantX);
            }
        );
        
        return false;
    }

    navigationHandlerLongRangeY(inputline, quadrantX)
    {
        let quadrantY = parseInt(inputline) - 1;

        if ((quadrantY == null) || isNaN(quadrantY) || quadrantY < 0 || quadrantY >= mapHeightQuadrants)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        let xd = this.enterprise.quadrantX - quadrantX;
        let yd = this.enterprise.quadrantY - quadrantY;
        let travelDistance = Math.sqrt(xd*xd + yd*yd);

        let jumpEnergyRequired = Math.floor(Enterprise.EnergyCostPerQuadrant * travelDistance);

        if (this.enterprise.freeEnergy < jumpEnergyRequired)
        {
            gameOutputAppend("Insufficient energy for long range jump, captain.  Jump requires " + jumpEnergyRequired + " free energy.");
            return true;
        }

        let trekgame = this;
        let confirmMenu = new Menu();
        confirmMenu.options.push
        (
            new MenuOption
            (
                "1", 
                ") ", 
                "CONFIRM JUMP TO QUADRANT " + (quadrantX+1) + ", " + (quadrantY+1) + ".\nTRIP TAKES 1 STARDATE, " + jumpEnergyRequired + " ENERGY\n",
                function()
                {
                    trekgame.enterprise.freeEnergy -= jumpEnergyRequired;
                    trekgame.changeToQuadrant(quadrantX, quadrantY);
                    trekgame.advanceStardate(1.0);
                    return true;
                }
            ),

            new MenuOption
            (
                "2",
                ") ",
                "CANCEL",
                function()
                {
                    return true;
                }
            )
        );

        this.awaitInput(confirmMenu.toString(), 1, function(inputline){return confirmMenu.chooseOption(inputline);});
    }

    navigationHandlerShortRangeX(inputline)
    {
        console.log("nav");
        let subsectorX = parseInt(inputline) - 1;

        if ((subsectorX == null) || isNaN(subsectorX) || subsectorX < 0 || subsectorX >= quadrantWidthSectors)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        this.awaitInput(
            "Enter destination subsector (Y coordinate)",
            2, 
            
            function(inputline)
            {
                return this.navigationHandlerShortRangeY(inputline, subsectorX);
            }
        );
        
        return false;
    }

    navigationHandlerShortRangeY(inputline, subsectorX)
    {
        let subsectorY = parseInt(inputline) - 1;

        if ((subsectorY == null) || isNaN(subsectorY) || subsectorY < 0 || subsectorY >= quadrantHeightSectors)
        {
            gameOutputAppend("Invalid value!");
            return false;
        }

        let sectorsToTravel = this.enterprise.distanceToSectorLoc(subsectorX, subsectorY);

        this.enterprise.warp(subsectorX, subsectorY, sectorsToTravel, this);

        this.currentQuadrant.klingonsFire(this.enterprise, this);

        this.advanceStardate(1.0);

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
            this.mainMenu.chooseOption(inputStr);
        }
    }

    gameInput(inputStr)
    {
        //console.log(">"+inputStr+"\n");
        //gameOutputAppend(inputStr);

        this.handleInput(inputStr);

        this.updateGame();
        autosave(this);
    }

    updateDisplay()
    {
        this.updateStatus();
        updateMap(this.updateMapScreen());
        updateMapHeader("SECTOR : " + this.enterprise.quadrantString());
        updateMapFooter(this.updateStatusFlags());
    }

    checkStarbaseDock()
    {
        if (this.enterprise.dockStarbase)
        {
            console.log("already docked.");
            return;
        }

        this.mainMenu.dockOption.enabled = false;

        let starbases = this.currentQuadrant.getEntitiesOfType(StarBase);

        for (var x in starbases)
        {
            var sb = starbases[x];

            if (this.enterprise.isAdjacentTo(sb))
            {
                console.log("adjacent");
                this.mainMenu.dockOption.enabled = true;
            }
            else
            {
                console.log("not adjacent");
            }
        }

        if (!this.inputHandler)
        {
            this.awaitInput(this.mainMenu.toString(), 3, null);
        }
    }

    updateGame()
    {
        this.updateDisplay();
        this.starbasesScan();
        this.enterpriseShortRangeScan();
        this.checkStarbaseDock();

        this.checkEndConditions();
    }

    enterpriseShortRangeScan()
    {
        this.enterprise.sensorHistory.updateSensorHistoryForEntityTypes
            (
                [Star, Klingon], 
                this.galaxyMap, 
                this.enterprise.quadrantX, 
                this.enterprise.quadrantY, 
                this.enterprise.quadrantX, 
                this.enterprise.quadrantY
            );
    }

    endGame()
    {
        this.gameOver = true;
        autosave(null);
        gameOutputAppend("\nThanks for playing!  Refresh the page to play again.");
        this.disableInput();
    }

    advanceStardate(adv)
    {
        this.starDate += adv;
        this.enterprise.autoRepairComponents();
    }

    checkEndConditions()
    {
        if (this.gameOver) return;

        if (this.starDate >= this.endStarDate)
        {
            gameOutputAppend("You were unable to complete your mission in time.");
            gameOutputAppend("The Klingons were able to execute their plan to destroy the Federation starbases!");
            gameOutputAppend("You'll be demoted for sure!");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (this.enterprise.isStranded())
        {
            gameOutputAppend("You have insufficient energy to power the warp engines!");
            gameOutputAppend("You are stranded, causing you to ultimately fail your mission.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));
            
            this.endGame();
        }
        else if (this.enterprise.isDestroyed())
        {
            gameOutputAppend("Your vessel has taken too much damage and has been destroyed.");
            gameOutputAppend("Your mission is failed.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (!StarBase.Instances)
        {
            gameOutputAppend("All the Federation starbases have been destroyed!");
            gameOutputAppend("You've failed in your mission.  The Federation is doomed.");

            gameOutputAppend("\nFinal Score : " + this.generateScore(false));

            this.endGame();
        }
        else if (!Klingon.Instances)
        {
            gameOutputAppend("You've managed to destroy all the enemy vessels, preventing the enemy from executing their plan!");
            gameOutputAppend("You're sure to get a promotion!");
            gameOutputAppend("Congratulations on your victory!");

            gameOutputAppend("\nFinal Score : " + this.generateScore(true));
            
            this.endGame();
        }
    }
    
    createMenus()
    {
        this.mainMenu = new MainMenu(this);
        this.computerMenu = new ShipComputerMenu(this);
    }


    updateStatusFlags()
    {
        let flags = [];
        
        if (this.enterprise.dockStarbase)
        {
            flags.push("DOCKED");
        }

        if (this.currentQuadrant.countEntitiesOfType(Klingon))
        {
            flags.push("RED ALERT");

            if (this.enterprise.isShieldLevelCritical(this.currentQuadrant.getEntitiesOfType(Klingon)))
            {
                flags.push("SHIELDS CRITICAL");
            }
        }
        else
        {
            flags.push("SECTOR CLEAR");
        }

        return flags.join(" | ");
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