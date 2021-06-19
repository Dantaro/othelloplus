// In Othello moves are annotated as a combination of letter (a-h) and number (1-8) corresponding to the location on the board.
// So we can parse any string of moves (assuming they are a continuous string of moves) using this.
moveSplitter = (moveString) => moveString.match(/.{1,2}/g)

// Parse openings (see openings.js) into a usable tree.  Each move acts as a node with the possible moves acting as children to the node
// The interesting part is we end up with multiple trees, one for each of the four starting move for black (C4, D3, E6, and F5)
// For each string in the openings JSON we'll identify the correct try, and once it gets to the final move in the sequence we'll also apply a name to the node.
buildOpeningsTree = () => {
    const openingTrees = {
        "C4" : new OpeningNode("C4"),
        "D3" : new OpeningNode("D3"),
        "E6" : new OpeningNode("E6"),
        "F5" : new OpeningNode("F5")
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
const openingMoveTree = buildOpeningsTree()

// Code that runs the extension

window.onload = function() {
    const bodyContainer = document.getElementsByClassName("body-container")[0]
    const moveContainer = document.getElementById("moves-content")

    // Read moves from page.  EOthello tracks moves in a JS object that we don't have access too
    // Luckily it also tracks them on the page in a textarea titled "moves-content", so we'll pull them out of there.
    let moves = moveSplitter(moveContainer.innerText)

    // Because we can't tell when the page gets new info we just need to check ever 5-10 seconds if we've gotten new data
    // But first we want to find it if we have it, so we don't wait 5 seconds to find the opening
    findOpening(moves, bodyContainer)
    setInterval(() => findOpening(moves, bodyContainer), 5000)
}

findOpening = (moves, bodyContainer) => {
    let movesCopy = moves.map(it => it) //Clone the list so we don't mess with the original

    const moveNavigator = document.getElementById("moveNavigator")
    // Find the opening used
    let currentMove = openingMoveTree[movesCopy[0]]
    let lastKnownOpeningMove
    movesCopy = movesCopy.slice(1)

    let openingName
    for (let i = 0 ; i < movesCopy.length ; i++) {
        if (currentMove.name !== undefined) {
            openingName = currentMove.name
            lastKnownOpeningMove = currentMove
        }

        let move = movesCopy[i]
        let nextMove = currentMove.paths[move]
        if (nextMove == null) {
            break
        }
        currentMove = nextMove
    }

    if (document.getElementById("opening-block")) {
        document.getElementById("opening-block").remove()
    }

    const openingBlock = document.createElement("center")
    openingBlock.setAttribute("id", "opening-block")
    openingBlock.innerHTML = `Opening: ${openingName} (${lastKnownOpeningMove.fullPath.join(" ")})`
    
    bodyContainer.insertBefore(openingBlock, moveNavigator)
}