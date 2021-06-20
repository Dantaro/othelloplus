// Helper Methods

// In Othello moves are annotated as a combination of letter (a-h) and number (1-8) corresponding to the location on the board.
// So we can parse any string of moves (assuming they are a continuous string of moves) using this.
moveSplitter = (moveString) => moveString.match(/.{1,2}/g)


// Read moves from page.  EOthello tracks moves in a JS object that we don't have access too
// Luckily it also tracks them on the page in a textarea titled "moves-content", so we'll pull them out of there.
getMovesFromPage = () => {
    const moves = document.getElementById(eothelloIds.MOVES_CONTENT).innerText
    if (moves) {
        return moveSplitter(moves)
    } else {
        return []
    }
}

// Parse openings (see openings.js) into a usable tree.  Each move acts as a node with the possible moves acting as children to the node
// The interesting part is we end up with multiple trees, one for each of the four starting move for black (C4, D3, E6, and F5)
// For each string in the openings JSON we'll identify the correct try, and once it gets to the final move in the sequence we'll also apply a name to the node.
buildOpeningsTrees = () => {
    const openingTrees = {
        "C4": new OpeningNode("C4"),
        "D3": new OpeningNode("D3"),
        "E6": new OpeningNode("E6"),
        "F5": new OpeningNode("F5")
    }

    return openings.map(opening => {
        const openingArr = opening.split(":")
        return {
            // The DB everything was pulled from uses a mix of upper and lower cases, but eothello uses only upper, so just adjust them.
            moves: moveSplitter(openingArr[0].toUpperCase()),
            name: openingArr[1]
        }
    }).reduce((acc, opening) => {
        // Find the first node 
        let currentNode = acc[opening.moves[0]]
        // For every other node in the list, iterate until we get to the last node, creating missing nodes as we go, and then add the name to the last node
        opening.moves.slice(1).forEach(move => {
            let nextNode = currentNode.paths[move]
            if (nextNode == null) {
                nextNode = new OpeningNode(move)
                currentNode.paths[move] = nextNode
            }
            currentNode = nextNode
        })
        currentNode.name = opening.name
        currentNode.fullPath = opening.moves
        return acc
    }, openingTrees)
}

class OpeningNode {
    constructor(move, name) {
        this.value = move
        this.paths = {}
        this.fullPath = []
        this.name = name
    }
}

// Constants
const openingMoveTrees = buildOpeningsTrees()
const elementIds = {
    MAIN_HOLDER: "othello-plus",
    OPENING_BLOCK: "othello-plus-opening-block",
    MOVES_BLOCK: "othello-plus-moves-block",
    FOOTER: "othello-plus-footer"
}
const eothelloIds = {
    MOVES_CONTENT: "moves-content"
}

// Code that runs the extension

window.onload = function () {
    initOthelloPlusDiv()
    setInterval(buildContent, 2500)
}


initOthelloPlusDiv = () => {
    // Find the main body div
    const bodyContainer = document.getElementsByClassName("body-container")[0]
    // Find the move navigator
    const moveNavigator = document.getElementById("moveNavigator")

    //Create our primary holder element
    const main = document.createElement("center")
    main.setAttribute("id", elementIds.MAIN_HOLDER)
    main.style.position = "absolute"
    main.style.top = "40vh"
    main.style.right = "5%"
    main.style.borderRadius = "25px"
    main.style.padding = "15px"
    main.style.color = "black"
    main.style.backgroundColor = "#00bc8c"
    main.style.zIndex = "-1" //If the screen gets too small, make sure we don't cover the board.  The board is more important than the extension

    // Create opening block
    const openingBlock = document.createElement("div")
    openingBlock.setAttribute("id", elementIds.OPENING_BLOCK)
    main.appendChild(openingBlock)

    // Create moves block
    const movesBlock = document.createElement("div")
    movesBlock.setAttribute("id", elementIds.MOVES_BLOCK)
    movesBlock.style.display = "grid"
    movesBlock.style.gridTemplateColumns = "20% 20% 20% 20% 20%"
    movesBlock.style.fontSize = "12px"
    main.appendChild(movesBlock)

    // Add footer to div
    const footer = document.createElement("footer")
    footer.setAttribute("id", elementIds.FOOTER)
    footer.innerText = "Othello Plus"
    footer.style.fontSize = "8px"
    footer.style.color = "black"
    footer.style.textAlign = "right"
    main.appendChild(footer)

    // Attach element to the body container right before the move navigator
    //bodyContainer.insertBefore(main, moveNavigator)

    document.body.appendChild(main)

    buildContent()
}

buildContent = () => {
    findOpening()
    displayMoves()
}

findOpening = () => {
    let moves = getMovesFromPage()
    // Find the opening used
    let currentMove = openingMoveTrees[moves[0]]
    let lastKnownOpeningMove
    moves = moves.slice(1)
    let openingName
    for (let i = 0; i < moves.length; i++) {
        let move = moves[i]
        let nextMove = currentMove.paths[move]
        if (nextMove == null) {
            break
        }
        currentMove = nextMove

        if (currentMove.name !== undefined) {
            openingName = currentMove.name
            lastKnownOpeningMove = currentMove
        }
    }
    if (lastKnownOpeningMove) {
        document.getElementById(elementIds.OPENING_BLOCK).innerHTML = `Opening: ${openingName} (${lastKnownOpeningMove.fullPath.join(" ")})`
    }
}

displayMoves = () => {
    let moves = getMovesFromPage()
    const movesBlock = document.getElementById(elementIds.MOVES_BLOCK)
    movesBlock.innerHTML = ""
    moves.map((move, index) => {
        const moveNumber = index + 1
        const moveElement = document.createElement("div")
        moveElement.innerText = `${moveNumber}. ${move}`
        return moveElement
    }).forEach(moveEle => {
        movesBlock.appendChild(moveEle)
    })

}