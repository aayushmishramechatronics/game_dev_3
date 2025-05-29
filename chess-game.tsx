"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Volume2, VolumeX, BookOpen, Palette } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king"
type PieceColor = "white" | "black"
type Difficulty = "easy" | "medium" | "hard" | "grandmaster"
type BoardTheme = "classic" | "wood" | "emerald" | "coral" | "midnight" | "purple"

interface Piece {
  type: PieceType
  color: PieceColor
}

interface Position {
  row: number
  col: number
}

interface Move {
  from: Position
  to: Position
  piece: Piece
  capturedPiece?: Piece
  notation?: string
}

interface GameTimer {
  white: number // seconds remaining
  black: number // seconds remaining
}

interface ChessComGame {
  url: string
  pgn: string
  time_control: string
  end_time: number
  rated: boolean
  white: {
    username: string
    rating: number
    result: string
  }
  black: {
    username: string
    rating: number
    result: string
  }
}

interface ThemeColors {
  light: string
  dark: string
  selected: string
  lastMoveFrom: {
    light: string
    dark: string
  }
  lastMoveTo: {
    light: string
    dark: string
  }
  border: string
}

interface OpeningMove {
  from: Position
  to: Position
}

interface Opening {
  name: string
  moves: OpeningMove[]
}

const BOARD_THEMES: Record<BoardTheme, ThemeColors> = {
  classic: {
    light: "bg-amber-100 bg-opacity-60",
    dark: "bg-amber-800 bg-opacity-80",
    selected: "bg-yellow-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-green-200 bg-opacity-60",
      dark: "bg-green-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-green-300 bg-opacity-70",
      dark: "bg-green-600 bg-opacity-80",
    },
    border: "border-amber-900/80 bg-amber-900/60",
  },
  wood: {
    light: "bg-orange-100 bg-opacity-70",
    dark: "bg-orange-900 bg-opacity-80",
    selected: "bg-yellow-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-yellow-200 bg-opacity-70",
      dark: "bg-yellow-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-yellow-300 bg-opacity-70",
      dark: "bg-yellow-600 bg-opacity-80",
    },
    border: "border-orange-950/80 bg-orange-950/60",
  },
  emerald: {
    light: "bg-emerald-100 bg-opacity-70",
    dark: "bg-emerald-800 bg-opacity-80",
    selected: "bg-blue-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-blue-200 bg-opacity-70",
      dark: "bg-blue-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-blue-300 bg-opacity-70",
      dark: "bg-blue-600 bg-opacity-80",
    },
    border: "border-emerald-900/80 bg-emerald-900/60",
  },
  coral: {
    light: "bg-red-100 bg-opacity-70",
    dark: "bg-red-800 bg-opacity-70",
    selected: "bg-yellow-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-yellow-200 bg-opacity-70",
      dark: "bg-yellow-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-yellow-300 bg-opacity-70",
      dark: "bg-yellow-600 bg-opacity-80",
    },
    border: "border-red-900/80 bg-red-900/60",
  },
  midnight: {
    light: "bg-slate-300 bg-opacity-70",
    dark: "bg-slate-800 bg-opacity-80",
    selected: "bg-blue-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-blue-200 bg-opacity-70",
      dark: "bg-blue-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-blue-300 bg-opacity-70",
      dark: "bg-blue-600 bg-opacity-80",
    },
    border: "border-slate-900/80 bg-slate-900/60",
  },
  purple: {
    light: "bg-purple-100 bg-opacity-70",
    dark: "bg-purple-800 bg-opacity-80",
    selected: "bg-pink-400 bg-opacity-80",
    lastMoveFrom: {
      light: "bg-pink-200 bg-opacity-70",
      dark: "bg-pink-700 bg-opacity-80",
    },
    lastMoveTo: {
      light: "bg-pink-300 bg-opacity-70",
      dark: "bg-pink-600 bg-opacity-80",
    },
    border: "border-purple-900/80 bg-purple-900/60",
  },
}

const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
}

const INITIAL_BOARD: (Piece | null)[][] = [
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],
  Array(8).fill({ type: "pawn", color: "black" }),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill({ type: "pawn", color: "white" }),
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
]

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    depth: 2,
    randomFactor: 0.3, // 30% chance to make a suboptimal move
  },
  medium: {
    depth: 3,
    randomFactor: 0.15, // 15% chance to make a suboptimal move
  },
  hard: {
    depth: 4,
    randomFactor: 0.05, // 5% chance to make a suboptimal move
  },
  grandmaster: {
    depth: 5,
    randomFactor: 0, // Always makes the best move
  },
}

// Opening book - simplified version with common openings
const OPENING_BOOK: Opening[] = [
  {
    name: "Queen's Gambit",
    moves: [
      { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
      { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // d5
      { from: { row: 6, col: 2 }, to: { row: 4, col: 2 } }, // c4
    ],
  },
  {
    name: "Sicilian Defense",
    moves: [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
      { from: { row: 1, col: 2 }, to: { row: 3, col: 2 } }, // c5
    ],
  },
  {
    name: "Ruy Lopez",
    moves: [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
      { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e5
      { from: { row: 7, col: 6 }, to: { row: 5, col: 5 } }, // Nf3
      { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } }, // Nc6
      { from: { row: 7, col: 5 }, to: { row: 3, col: 1 } }, // Bb5
    ],
  },
  {
    name: "French Defense",
    moves: [
      { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } }, // e4
      { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } }, // e6
      { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
      { from: { row: 1, col: 3 }, to: { row: 3, col: 3 } }, // d5
    ],
  },
  {
    name: "King's Indian Defense",
    moves: [
      { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } }, // d4
      { from: { row: 0, col: 6 }, to: { row: 2, col: 5 } }, // Nf6
      { from: { row: 6, col: 2 }, to: { row: 4, col: 2 } }, // c4
      { from: { row: 1, col: 6 }, to: { row: 3, col: 6 } }, // g6
    ],
  },
]

export default function Component() {
  const [board, setBoard] = useState<(Piece | null)[][]>(INITIAL_BOARD)
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white")
  const [gameStatus, setGameStatus] = useState<"playing" | "check" | "checkmate" | "stalemate">("playing")
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [timer, setTimer] = useState<GameTimer>({ white: 180, black: 180 }) // 3 minutes each
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("classic")
  const [proGames, setProGames] = useState<ChessComGame[]>([])
  const [selectedGame, setSelectedGame] = useState<ChessComGame | null>(null)
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [lastMoveFrom, setLastMoveFrom] = useState<Position | null>(null)
  const [lastMoveTo, setLastMoveTo] = useState<Position | null>(null)
  const [evaluation, setEvaluation] = useState<number>(0) // Positive is good for black, negative for white
  const [currentOpening, setCurrentOpening] = useState<string | null>(null)
  const [moveNumber, setMoveNumber] = useState<number>(0)

  // Audio refs for sound effects
  const moveSound = useRef<HTMLAudioElement | null>(null)
  const captureSound = useRef<HTMLAudioElement | null>(null)
  const checkSound = useRef<HTMLAudioElement | null>(null)
  const checkmateSound = useRef<HTMLAudioElement | null>(null)
  const gameStartSound = useRef<HTMLAudioElement | null>(null)

  // Initialize audio elements
  useEffect(() => {
    // Create audio contexts for different sounds
    const createAudioContext = (frequency: number, duration: number, type: OscillatorType = "sine") => {
      return () => {
        if (!soundEnabled) return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = type

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      }
    }

    // Assign sound functions
    moveSound.current = createAudioContext(800, 0.1) as any
    captureSound.current = createAudioContext(400, 0.2, "square") as any
    checkSound.current = createAudioContext(1000, 0.3, "triangle") as any
    checkmateSound.current = createAudioContext(200, 1, "sawtooth") as any
    gameStartSound.current = createAudioContext(600, 0.5) as any
  }, [soundEnabled])

  // Fetch Magnus Carlsen's games from Chess.com API
  useEffect(() => {
    const fetchMagnusGames = async () => {
      try {
        setIsLoadingGames(true)
        const response = await fetch("https://api.chess.com/pub/player/magnuscarlsen/games/archives")
        const data = await response.json()

        // Get the most recent archive
        const mostRecentArchiveUrl = data.archives[data.archives.length - 1]

        // Fetch games from the most recent archive
        const gamesResponse = await fetch(mostRecentArchiveUrl)
        const gamesData = await gamesResponse.json()

        // Take only the first 10 games to avoid overwhelming the UI
        setProGames(gamesData.games.slice(0, 10))
      } catch (error) {
        console.error("Failed to fetch games:", error)
      } finally {
        setIsLoadingGames(false)
      }
    }

    fetchMagnusGames()
  }, [])

  // Update evaluation whenever the board changes
  useEffect(() => {
    const newEvaluation = evaluateBoard(board)
    setEvaluation(newEvaluation)
  }, [board])

  // Check for openings
  useEffect(() => {
    if (moveHistory.length === 0) {
      setCurrentOpening(null)
      return
    }

    // Check if current sequence of moves matches any opening
    for (const opening of OPENING_BOOK) {
      if (moveHistory.length <= opening.moves.length) {
        let matches = true
        for (let i = 0; i < moveHistory.length; i++) {
          const historyMove = moveHistory[i]
          const bookMove = opening.moves[i]

          if (
            !bookMove ||
            historyMove.from.row !== bookMove.from.row ||
            historyMove.from.col !== bookMove.from.col ||
            historyMove.to.row !== bookMove.to.row ||
            historyMove.to.col !== bookMove.to.col
          ) {
            matches = false
            break
          }
        }

        if (matches) {
          setCurrentOpening(opening.name)
          return
        }
      }
    }

    setCurrentOpening(null)
  }, [moveHistory])

  const playSound = (soundType: "move" | "capture" | "check" | "checkmate" | "gameStart") => {
    if (!soundEnabled) return

    try {
      switch (soundType) {
        case "move":
          moveSound.current?.()
          break
        case "capture":
          captureSound.current?.()
          break
        case "check":
          checkSound.current?.()
          break
        case "checkmate":
          checkmateSound.current?.()
          break
        case "gameStart":
          gameStartSound.current?.()
          break
      }
    } catch (error) {
      console.log("Audio playback failed:", error)
    }
  }

  const isValidPosition = (row: number, col: number): boolean => {
    return row >= 0 && row < 8 && col >= 0 && col < 8
  }

  const getPieceAt = (row: number, col: number): Piece | null => {
    if (!isValidPosition(row, col)) return null
    return board[row][col]
  }

  const isValidMove = (from: Position, to: Position, piece: Piece): boolean => {
    if (!isValidPosition(to.row, to.col)) return false

    const targetPiece = getPieceAt(to.row, to.col)
    if (targetPiece && targetPiece.color === piece.color) return false

    const rowDiff = to.row - from.row
    const colDiff = to.col - from.col
    const absRowDiff = Math.abs(rowDiff)
    const absColDiff = Math.abs(colDiff)

    switch (piece.type) {
      case "pawn":
        const direction = piece.color === "white" ? -1 : 1
        const startRow = piece.color === "white" ? 6 : 1

        if (colDiff === 0) {
          if (rowDiff === direction && !targetPiece) return true
          if (from.row === startRow && rowDiff === 2 * direction && !targetPiece) return true
        } else if (absColDiff === 1 && rowDiff === direction && targetPiece) {
          return true
        }
        return false

      case "rook":
        if (rowDiff === 0 || colDiff === 0) {
          return isPathClear(from, to)
        }
        return false

      case "bishop":
        if (absRowDiff === absColDiff) {
          return isPathClear(from, to)
        }
        return false

      case "queen":
        if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
          return isPathClear(from, to)
        }
        return false

      case "knight":
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)

      case "king":
        return absRowDiff <= 1 && absColDiff <= 1

      default:
        return false
    }
  }

  const isPathClear = (from: Position, to: Position): boolean => {
    const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0
    const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0

    let currentRow = from.row + rowStep
    let currentCol = from.col + colStep

    while (currentRow !== to.row || currentCol !== to.col) {
      if (getPieceAt(currentRow, currentCol)) return false
      currentRow += rowStep
      currentCol += colStep
    }

    return true
  }

  const findKing = (color: PieceColor): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = getPieceAt(row, col)
        if (piece && piece.type === "king" && piece.color === color) {
          return { row, col }
        }
      }
    }
    return null
  }

  const isInCheck = (color: PieceColor, boardState: (Piece | null)[][] = board): boolean => {
    const kingPos = findKing(color)
    if (!kingPos) return false

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col]
        if (piece && piece.color !== color) {
          if (isValidMove({ row, col }, kingPos, piece)) {
            return true
          }
        }
      }
    }
    return false
  }

  const moveToAlgebraicNotation = (
    move: Move,
    boardState: (Piece | null)[][],
    isCheck: boolean,
    isCheckmate: boolean,
  ): string => {
    const { from, to, piece, capturedPiece } = move

    // Handle castling
    if (piece.type === "king" && Math.abs(to.col - from.col) === 2) {
      return to.col > from.col ? "O-O" : "O-O-O"
    }

    let notation = ""

    // Piece symbol (empty for pawn)
    if (piece.type !== "pawn") {
      notation += piece.type.charAt(0).toUpperCase()
    }

    // Check for disambiguation
    if (piece.type !== "pawn") {
      const sameTypePieces: Position[] = []
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const p = boardState[row][col]
          if (p && p.type === piece.type && p.color === piece.color && (row !== from.row || col !== from.col)) {
            if (isValidMove({ row, col }, to, p)) {
              const testBoard = boardState.map((r) => [...r])
              testBoard[to.row][to.col] = p
              testBoard[row][col] = null
              if (!isInCheck(piece.color, testBoard)) {
                sameTypePieces.push({ row, col })
              }
            }
          }
        }
      }

      if (sameTypePieces.length > 0) {
        const sameFile = sameTypePieces.some((pos) => pos.col === from.col)
        const sameRank = sameTypePieces.some((pos) => pos.row === from.row)

        if (!sameFile) {
          notation += String.fromCharCode(97 + from.col) // file letter
        } else if (!sameRank) {
          notation += (8 - from.row).toString() // rank number
        } else {
          notation += String.fromCharCode(97 + from.col) + (8 - from.row).toString()
        }
      }
    }

    // Capture notation
    if (capturedPiece) {
      if (piece.type === "pawn") {
        notation += String.fromCharCode(97 + from.col) // file letter for pawn captures
      }
      notation += "x"
    }

    // Destination square
    notation += String.fromCharCode(97 + to.col) + (8 - to.row).toString()

    // Check and checkmate
    if (isCheckmate) {
      notation += "#"
    } else if (isCheck) {
      notation += "+"
    }

    return notation
  }

  const makeMove = (from: Position, to: Position): boolean => {
    const piece = getPieceAt(from.row, from.col)
    if (!piece || piece.color !== currentPlayer) return false

    if (!isValidMove(from, to, piece)) return false

    const newBoard = board.map((row) => [...row])
    const capturedPiece = newBoard[to.row][to.col]

    newBoard[to.row][to.col] = piece
    newBoard[from.row][from.col] = null

    // Check if this move would put own king in check
    if (isInCheck(currentPlayer, newBoard)) return false

    // Check game status after move
    const opponent = currentPlayer === "white" ? "black" : "white"
    const isOpponentInCheck = isInCheck(opponent, newBoard)
    const isOpponentInCheckmate = isOpponentInCheck && isCheckmate(opponent, newBoard)

    // Play appropriate sound
    if (isOpponentInCheckmate) {
      playSound("checkmate")
    } else if (isOpponentInCheck) {
      playSound("check")
    } else if (capturedPiece) {
      playSound("capture")
    } else {
      playSound("move")
    }

    // Generate algebraic notation
    const notation = moveToAlgebraicNotation(
      { from, to, piece, capturedPiece: capturedPiece || undefined },
      board,
      isOpponentInCheck,
      isOpponentInCheckmate,
    )

    setBoard(newBoard)
    setLastMoveFrom(from)
    setLastMoveTo(to)
    setMoveNumber(moveNumber + 1)

    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
    }
    setMoveHistory((prev) => [...prev, { ...move, notation }])

    if (isOpponentInCheckmate) {
      setGameStatus("checkmate")
      setIsTimerRunning(false)
    } else if (isOpponentInCheck) {
      setGameStatus("check")
    } else if (isStalemate(opponent, newBoard)) {
      setGameStatus("stalemate")
      setIsTimerRunning(false)
    } else {
      setGameStatus("playing")
    }

    setCurrentPlayer(opponent)
    return true
  }

  const getAllValidMoves = (color: PieceColor, boardState: (Piece | null)[][]): Move[] => {
    const moves: Move[] = []

    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = boardState[fromRow][fromCol]
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              const from = { row: fromRow, col: fromCol }
              const to = { row: toRow, col: toCol }

              if (isValidMove(from, to, piece)) {
                const testBoard = boardState.map((row) => [...row])
                testBoard[toRow][toCol] = piece
                testBoard[fromRow][fromCol] = null

                if (!isInCheck(color, testBoard)) {
                  moves.push({
                    from,
                    to,
                    piece,
                    capturedPiece: boardState[toRow][toCol] || undefined,
                  })
                }
              }
            }
          }
        }
      }
    }

    return moves
  }

  const isCheckmate = (color: PieceColor, boardState: (Piece | null)[][]): boolean => {
    return isInCheck(color, boardState) && getAllValidMoves(color, boardState).length === 0
  }

  const isStalemate = (color: PieceColor, boardState: (Piece | null)[][]): boolean => {
    return !isInCheck(color, boardState) && getAllValidMoves(color, boardState).length === 0
  }

  const evaluateBoard = (boardState: (Piece | null)[][]): number => {
    const pieceValues = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 20000,
    }

    // Position-based evaluation tables (simplified)
    const pawnPositionValues = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5, 5, 10, 25, 25, 10, 5, 5],
      [0, 0, 0, 20, 20, 0, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ]

    const knightPositionValues = [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50],
    ]

    let score = 0

    // Material evaluation
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = boardState[row][col]
        if (piece) {
          let value = pieceValues[piece.type]

          // Add position-based evaluation
          if (piece.type === "pawn") {
            value += piece.color === "white" ? pawnPositionValues[row][col] : pawnPositionValues[7 - row][col]
          } else if (piece.type === "knight") {
            value += piece.color === "white" ? knightPositionValues[row][col] : knightPositionValues[7 - row][col]
          }

          score += piece.color === "black" ? value : -value
        }
      }
    }

    // Check for checkmate
    if (isCheckmate("white", boardState)) {
      return 10000 // Black wins
    } else if (isCheckmate("black", boardState)) {
      return -10000 // White wins
    }

    // Check for check
    if (isInCheck("white", boardState)) {
      score += 50 // Bonus for putting white in check
    } else if (isInCheck("black", boardState)) {
      score -= 50 // Bonus for putting black in check
    }

    return score
  }

  const minimax = (
    boardState: (Piece | null)[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
  ): number => {
    if (depth === 0) {
      return evaluateBoard(boardState)
    }

    const color = isMaximizing ? "black" : "white"
    const moves = getAllValidMoves(color, boardState)

    if (moves.length === 0) {
      if (isInCheck(color, boardState)) {
        return isMaximizing ? -10000 : 10000
      }
      return 0 // Stalemate
    }

    if (isMaximizing) {
      let maxEval = Number.NEGATIVE_INFINITY
      for (const move of moves) {
        const newBoard = boardState.map((row) => [...row])
        newBoard[move.to.row][move.to.col] = move.piece
        newBoard[move.from.row][move.from.col] = null

        const eval_ = minimax(newBoard, depth - 1, false, alpha, beta)
        maxEval = Math.max(maxEval, eval_)
        alpha = Math.max(alpha, eval_)
        if (beta <= alpha) break
      }
      return maxEval
    } else {
      let minEval = Number.POSITIVE_INFINITY
      for (const move of moves) {
        const newBoard = boardState.map((row) => [...row])
        newBoard[move.to.row][move.to.col] = move.piece
        newBoard[move.from.row][move.from.col] = null

        const eval_ = minimax(newBoard, depth - 1, true, alpha, beta)
        minEval = Math.min(minEval, eval_)
        beta = Math.min(beta, eval_)
        if (beta <= alpha) break
      }
      return minEval
    }
  }

  const getComputerMove = (): Move | null => {
    // Check if we can use an opening book move
    if (moveNumber < 10) {
      // Only use opening book for first 10 moves
      for (const opening of OPENING_BOOK) {
        if (moveHistory.length < opening.moves.length) {
          let matches = true
          for (let i = 0; i < moveHistory.length; i++) {
            const historyMove = moveHistory[i]
            const bookMove = opening.moves[i]

            if (
              historyMove.from.row !== bookMove.from.row ||
              historyMove.from.col !== bookMove.from.col ||
              historyMove.to.row !== bookMove.to.row ||
              historyMove.to.col !== bookMove.to.col
            ) {
              matches = false
              break
            }
          }

          if (matches && moveHistory.length % 2 === 1) {
            // Black's turn
            const nextBookMove = opening.moves[moveHistory.length]
            if (nextBookMove) {
              const piece = getPieceAt(nextBookMove.from.row, nextBookMove.from.col)
              if (piece && piece.color === "black") {
                return {
                  from: nextBookMove.from,
                  to: nextBookMove.to,
                  piece: piece,
                }
              }
            }
          }
        }
      }
    }

    // If no opening book move, use minimax
    const moves = getAllValidMoves("black", board)
    if (moves.length === 0) return null

    const settings = DIFFICULTY_SETTINGS[difficulty]

    // For easy and medium difficulties, occasionally make a suboptimal move
    if (Math.random() < settings.randomFactor) {
      // Choose a random move from the available moves
      return moves[Math.floor(Math.random() * moves.length)]
    }

    // Otherwise, use minimax to find the best move
    let bestMove = moves[0]
    let bestValue = Number.NEGATIVE_INFINITY

    for (const move of moves) {
      const newBoard = board.map((row) => [...row])
      newBoard[move.to.row][move.to.col] = move.piece
      newBoard[move.from.row][move.from.col] = null

      const value = minimax(newBoard, settings.depth, false, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
      if (value > bestValue) {
        bestValue = value
        bestMove = move
      }
    }

    return bestMove
  }

  useEffect(() => {
    if (currentPlayer === "black" && gameStatus === "playing") {
      const timer = setTimeout(() => {
        const computerMove = getComputerMove()
        if (computerMove) {
          makeMove(computerMove.from, computerMove.to)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameStatus, difficulty])

  useEffect(() => {
    if (!isTimerRunning || gameStatus !== "playing") return

    const interval = setInterval(() => {
      setTimer((prev) => {
        const newTimer = { ...prev }
        if (currentPlayer === "white") {
          newTimer.white = Math.max(0, newTimer.white - 1)
          if (newTimer.white === 0) {
            setGameStatus("checkmate")
            setIsTimerRunning(false)
            playSound("checkmate")
          }
        } else {
          newTimer.black = Math.max(0, newTimer.black - 1)
          if (newTimer.black === 0) {
            setGameStatus("checkmate")
            setIsTimerRunning(false)
            playSound("checkmate")
          }
        }
        return newTimer
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerRunning, currentPlayer, gameStatus])

  const handleSquareClick = (row: number, col: number) => {
    if (currentPlayer !== "white" || gameStatus !== "playing") return

    const clickedPiece = getPieceAt(row, col)

    if (selectedSquare) {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
      } else {
        const success = makeMove(selectedSquare, { row, col })
        setSelectedSquare(null)
      }
    } else if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedSquare({ row, col })
    }
  }

  const resetGame = () => {
    setBoard(INITIAL_BOARD)
    setSelectedSquare(null)
    setCurrentPlayer("white")
    setGameStatus("playing")
    setMoveHistory([])
    setTimer({ white: 180, black: 180 })
    setIsTimerRunning(true)
    setLastMoveFrom(null)
    setLastMoveTo(null)
    setMoveNumber(0)
    setCurrentOpening(null)
    playSound("gameStart")
  }

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0
    const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col
    const isLastMoveFrom = lastMoveFrom && lastMoveFrom.row === row && lastMoveFrom.col === col
    const isLastMoveTo = lastMoveTo && lastMoveTo.row === row && lastMoveTo.col === col
    const theme = BOARD_THEMES[boardTheme]

    if (isSelected) return theme.selected
    if (isLastMoveFrom) return isLight ? theme.lastMoveFrom.light : theme.lastMoveFrom.dark
    if (isLastMoveTo) return isLight ? theme.lastMoveTo.light : theme.lastMoveTo.dark
    return isLight ? theme.light : theme.dark
  }

  const getStatusMessage = (): string => {
    switch (gameStatus) {
      case "check":
        return `${currentPlayer === "white" ? "White" : "Black"} is in check!`
      case "checkmate":
        if (timer.white === 0) return "Time's up! Black wins!"
        if (timer.black === 0) return "Time's up! White wins!"
        return `Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins!`
      case "stalemate":
        return "Stalemate! The game is a draw."
      default:
        return `${currentPlayer === "white" ? "Your" : "Computer's"} turn`
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Parse PGN to extract moves
  const parsePgn = (pgn: string): string[] => {
    const moves: string[] = []
    // Remove comments and variations
    const cleanPgn = pgn.replace(/\{[^}]*\}/g, "").replace(/$$[^)]*$$/g, "")

    // Extract moves
    const moveRegex = /\d+\.\s+(\S+)(?:\s+(\S+))?/g
    let match

    while ((match = moveRegex.exec(cleanPgn)) !== null) {
      if (match[1]) moves.push(match[1])
      if (match[2]) moves.push(match[2])
    }

    return moves
  }

  // Load a professional game
  const loadProGame = (game: ChessComGame) => {
    resetGame()
    setSelectedGame(game)

    // We could implement a PGN parser to actually load the game moves,
    // but for simplicity we'll just show the game information
    // A full implementation would parse the PGN and set up the board accordingly
  }

  // Format evaluation for display
  const formatEvaluation = (eval_: number): string => {
    if (eval_ >= 10000) return "Mate"
    if (eval_ <= -10000) return "Mate"

    const absEval = Math.abs(eval_) / 100
    const sign = eval_ > 0 ? "+" : eval_ < 0 ? "-" : ""
    return `${sign}${absEval.toFixed(1)}`
  }

  // Calculate evaluation bar percentage
  const getEvaluationPercentage = (): number => {
    // Convert evaluation to a percentage between 0 and 100
    // 0 means white is winning completely, 100 means black is winning completely
    if (evaluation >= 10000) return 100
    if (evaluation <= -10000) return 0

    // Sigmoid function to map evaluation to percentage
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x / 500))
    return sigmoid(evaluation) * 100
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex flex-col items-center justify-center p-4 sm:p-6"
      style={{
        backgroundImage: "url('/background.jpeg')",
      }}
    >
      <div className="w-full max-w-6xl mx-auto">
        <Card className="glassmorphism border-white/20 mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">2D Chess</CardTitle>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-lg font-medium text-white/90 drop-shadow">{getStatusMessage()}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
                  <SelectTrigger className="w-[180px] bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Newbie</SelectItem>
                    <SelectItem value="medium">Intermediate</SelectItem>
                    <SelectItem value="hard">Expert</SelectItem>
                    <SelectItem value="grandmaster">Grandmaster</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={boardTheme} onValueChange={(value) => setBoardTheme(value as BoardTheme)}>
                  <SelectTrigger className="w-[180px] bg-white/10 text-white border-white/20">
                    <Palette className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Board Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="wood">Wood</SelectItem>
                    <SelectItem value="emerald">Emerald</SelectItem>
                    <SelectItem value="coral">Coral</SelectItem>
                    <SelectItem value="midnight">Midnight</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="glassmorphism border-white/30 text-white hover:bg-white/20">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Magnus' Game
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glassmorphism-dark border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Magnus Carlsen's Games</DialogTitle>
                      <DialogDescription className="text-white/70">
                        Game History fetched from Chess.com, Browse the Moves!
                      </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="games">
                      <TabsList className="bg-black/20">
                        <TabsTrigger value="games">Games</TabsTrigger>
                        {selectedGame && <TabsTrigger value="analysis">Analysis</TabsTrigger>}
                      </TabsList>

                      <TabsContent value="games">
                        <ScrollArea className="h-[300px]">
                          {isLoadingGames ? (
                            <div className="flex items-center justify-center h-full">
                              <p>Loading Games...</p>
                            </div>
                          ) : proGames.length > 0 ? (
                            <div className="space-y-2 p-2">
                              {proGames.map((game, index) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                  onClick={() => loadProGame(game)}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                      {game.white.username} vs {game.black.username}
                                    </span>
                                    <span className="text-sm text-white/60">
                                      {new Date(game.end_time * 1000).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm mt-1">
                                    <span>White: {game.white.result}</span>
                                    <span>Black: {game.black.result}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p>No Games Available</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      {selectedGame && (
                        <TabsContent value="analysis">
                          <div className="p-4">
                            <h3 className="text-lg font-medium mb-2">Game Details</h3>
                            <p className="mb-1">
                              <strong>White:</strong> {selectedGame.white.username} ({selectedGame.white.rating})
                            </p>
                            <p className="mb-1">
                              <strong>Black:</strong> {selectedGame.black.username} ({selectedGame.black.rating})
                            </p>
                            <p className="mb-1">
                              <strong>Result:</strong> {selectedGame.white.result} - {selectedGame.black.result}
                            </p>
                            <p className="mb-1">
                              <strong>Time Control:</strong> {selectedGame.time_control}
                            </p>
                            <p className="mb-3">
                              <strong>Date:</strong> {new Date(selectedGame.end_time * 1000).toLocaleDateString()}
                            </p>

                            <h4 className="font-medium mb-2">Moves</h4>
                            <div className="bg-black/20 p-3 rounded-md max-h-[150px] overflow-y-auto">
                              {parsePgn(selectedGame.pgn).map((move, i) => (
                                <span key={i} className="mr-2">
                                  {i % 2 === 0 && <span className="text-white/60">{Math.floor(i / 2) + 1}. </span>}
                                  {move}
                                </span>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center">
          {/* Left side - Computer Timer and Move History */}
          <div className="flex flex-col gap-4 w-full lg:w-80">
            {/* Computer Timer */}
            <Card className="glassmorphism-dark border-white/10">
              <CardContent className="p-4">
                <div
                  className={`flex items-center justify-center gap-3 p-3 rounded-lg transition-all ${
                    currentPlayer === "black" ? "bg-red-500/20 ring-2 ring-red-400/50" : "bg-gray-700/30"
                  }`}
                >
                  <Clock className="w-5 h-5 text-white" />
                  <span className="font-mono text-lg text-white font-semibold">
                    Computer: {formatTime(timer.black)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Move History */}
            <Card className="glassmorphism-dark border-white/10 hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3 h-64 overflow-y-auto">
                  {moveHistory.length === 0 ? (
                    <p className="text-white/60 text-sm">No Moves Yet</p>
                  ) : (
                    <div className="space-y-1">
                      {moveHistory.map((move, index) => {
                        const moveNumber = Math.floor(index / 2) + 1
                        const isWhiteMove = index % 2 === 0

                        return (
                          <div key={index} className="flex text-sm">
                            {isWhiteMove && <span className="w-8 text-white/70 font-medium">{moveNumber}.</span>}
                            <span className={`flex-1 ${isWhiteMove ? "text-blue-300" : "text-white/90"}`}>
                              {(move as any).notation ||
                                `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}-${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Opening Book */}
            <Card className="glassmorphism-dark border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Opening</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                  {currentOpening ? (
                    <p className="text-white font-medium">{currentOpening}</p>
                  ) : (
                    <p className="text-white/60 text-sm">No Recognized Opening</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Chess Board and Evaluation */}
          <div className="flex flex-col items-center gap-4">
            {/* Evaluation Bar */}
            <div className="w-full flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-6 w-full bg-gray-800/50 rounded-md overflow-hidden flex flex-col">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300"
                        style={{ width: `${100 - getEvaluationPercentage()}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Evaluation: {formatEvaluation(evaluation)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-white font-mono text-sm">{formatEvaluation(evaluation)}</span>
            </div>

            {/* Chess Board */}
            <div
              className={`grid grid-cols-8 gap-0 border-4 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm ${BOARD_THEMES[boardTheme].border}`}
            >
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold transition-all hover:brightness-110 active:scale-95 ${getSquareColor(rowIndex, colIndex)}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    disabled={currentPlayer !== "white" || gameStatus !== "playing"}
                  >
                    {piece && PIECE_SYMBOLS[piece.color][piece.type]}
                  </button>
                )),
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={resetGame}
                variant="outline"
                className="glassmorphism border-white/30 text-white hover:bg-white/20"
              >
                New Game
              </Button>
              <Button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                variant="outline"
                disabled={gameStatus !== "playing"}
                className="glassmorphism border-white/30 text-white hover:bg-white/20"
              >
                {isTimerRunning ? "Pause" : "Resume"}
              </Button>
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="outline"
                className="glassmorphism border-white/30 text-white hover:bg-white/20"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Right side - User Timer and Mobile Move History */}
          <div className="flex flex-col gap-4 w-full lg:w-80">
            {/* User Timer */}
            <Card className="glassmorphism-dark border-white/10">
              <CardContent className="p-4">
                <div
                  className={`flex items-center justify-center gap-3 p-3 rounded-lg transition-all ${
                    currentPlayer === "white" ? "bg-blue-500/20 ring-2 ring-blue-400/50" : "bg-gray-700/30"
                  }`}
                >
                  <Clock className="w-5 h-5 text-white" />
                  <span className="font-mono text-lg text-white font-semibold">You: {formatTime(timer.white)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Move History */}
            <Card className="glassmorphism-dark border-white/10 lg:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3 h-32 overflow-y-auto">
                  {moveHistory.length === 0 ? (
                    <p className="text-white/60 text-sm">No Moves Yet</p>
                  ) : (
                    <div className="space-y-1">
                      {moveHistory.slice(-5).map((move, index) => {
                        const actualIndex = moveHistory.length - 5 + index
                        const moveNumber = Math.floor(actualIndex / 2) + 1
                        const isWhiteMove = actualIndex % 2 === 0

                        return (
                          <div key={actualIndex} className="flex text-sm">
                            {isWhiteMove && <span className="w-8 text-white/70 font-medium">{moveNumber}.</span>}
                            <span className={`flex-1 ${isWhiteMove ? "text-blue-300" : "text-white/90"}`}>
                              {(move as any).notation ||
                                `${String.fromCharCode(97 + move.from.col)}${8 - move.from.row}-${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Opening Display */}
            <Card className="glassmorphism-dark border-white/10 lg:hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Opening</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                  {currentOpening ? (
                    <p className="text-white font-medium">{currentOpening}</p>
                  ) : (
                    <p className="text-white/60 text-sm">No Recognized Opening</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Game End Modal */}
        {gameStatus !== "playing" && (
          <Card className="glassmorphism border-white/20 mt-6 mx-auto max-w-md">
            <CardContent className="text-center p-6">
              <p className="font-bold text-xl text-white mb-4 drop-shadow">{getStatusMessage()}</p>
              <Button
                onClick={resetGame}
                className="bg-blue-600/80 hover:bg-blue-700/80 text-white border-0 backdrop-blur-sm"
              >
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
