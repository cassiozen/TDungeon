import type { Get, Obj, Num, List, Union } from "./TypeUtils";

type PlayerState = {
  health: number;
  position: MapLevel | MapElement;
  inventory: GameItems[];
};

type GameItems = "Small Key" | "Spider Mask" | "Green Gem";

type GameState = [string, PlayerState];

type MapElementAction = [GameItems | undefined, keyof Actions<any>];

type Wall = { type: "wall"; description: "It's a wall"; actions: {} };

type Corridor<TDescription extends string = any, TTarget extends MapLevel = any> = {
  type: "corridor";
  target: TTarget;
  description: TDescription;
  actions: {};
};

type Room<
  TDescription extends string = any,
  TInsideDescription extends string = any,
  TActions extends { [key: string]: MapElementAction } = any
> = {
  type: "room";
  description: TDescription;
  insideDescription: TInsideDescription;
  actions: TActions;
};

type Item<TDescription extends string = any, TActions extends { [key: string]: MapElementAction } = any> = {
  type: "item";
  description: TDescription;
  actions: TActions;
};

type MapElement = Wall | Corridor | Room | Item;
type InteractiveMapElement = Room | Item;
type _MapLevel = [/* Left: */ MapElement, /* Forward: */ MapElement, /* Right: */ MapElement];

type MapLevel<TLevel extends _MapLevel = _MapLevel> = {
  level: TLevel;
  actions: { left: [undefined, 0]; forward: [undefined, 1]; right: [undefined, 2] };
};

type A = MapLevel<GameMap[0]["level"]>["actions"];

type Actions<TPlayerState extends PlayerState> = {
  "keyRoom.key": [
    "You find a small key! You put in your pocket and leave the room, leaving the door open as you found.",
    Obj.Update<
      TPlayerState,
      {
        position: GameMap[0];
        inventory: ["Small Key", ...TPlayerState["inventory"]];
      }
    >
  ];
  "keyRoom.exit": [
    `You leave the room.`,
    Obj.Update<
      TPlayerState,
      {
        position: GameMap[0];
      }
    >
  ];
  "spidersRoomSouthDoor.runForDoor": [
    "You make a run for the other door, only to find it locked. You get back from where you came and, as you leave the room, you are bitten and loose one hit point.",
    Obj.Update<TPlayerState, { health: Num.Decrement<TPlayerState["health"]>; position: GameMap[1] }>
  ];
  "spidersRoomSouthDoor.exit": [
    "You just go back from where you came and avoid getting hurt.",
    Obj.Update<TPlayerState, { position: GameMap[1] }>
  ];
  "spidersRoomEastDoor.runForDoor": [
    "You make a run for the other door, and as you cross it you are bitten and loose one hit point.",
    Obj.Update<TPlayerState, { position: GameMap[1]; health: Num.Decrement<TPlayerState["health"]> }>
  ];
  "spidersRoom.putMask": [
    "As soon as you put on the mask, the spiders gather around you, and as you move, they spread out making way for you. You focus your efforts in investigating the room and find a hidden passage that leads you... to the lost treasure of Anders Hejlsberg! You did it adventurer, now go check the code.",
    never
  ];
  "chest.unlock": [
    "You grab the small key from your pocket and it fits in the chest lock. Click. Inside the chest you find a hairy mask with multiple eyes. You put it in your bag and close the chest.",
    Obj.Update<
      TPlayerState,
      {
        position: GameMap[2];
        inventory: ["Spider Mask", ...TPlayerState["inventory"]];
      }
    >
  ];
  "chest.force": [
    "As you rattle the chest's lock, a spider comes out of nowhere and bites you. ",
    Obj.Update<TPlayerState, { position: GameMap[2]; health: Num.Decrement<TPlayerState["health"]> }>
  ];
  "chest.leave": [
    "",
    Obj.Update<
      TPlayerState,
      {
        position: GameMap[2];
      }
    >
  ];
};

type GameMap = [
  MapLevel<
    [
      Room<
        "a half opened door",
        "Opening the door you find youserlf in a room with a small desk. The desk has one drawer",
        {
          "Open the drawer": [undefined, "keyRoom.key"];
          "Exit the room": [undefined, "keyRoom.exit"];
        }
      >,
      Corridor<"a dark and humid corridor.", GameMap[1]>,
      Wall
    ]
  >,
  MapLevel<
    [
      Wall,
      Room<
        "a door - and you can feel air current comming through it",
        "You open the door to a room full of venomous spiders. There's another door in the right wall",
        {
          "Reach for the other door": [undefined, "spidersRoomSouthDoor.runForDoor"];
          "Exit from where you came": [undefined, "spidersRoomSouthDoor.exit"];
          "Put on the mask": ["Spider Mask", "spidersRoom.putMask"];
        }
      >,
      Corridor<"a tunnel that biffurcates", GameMap[2]>
    ]
  >,
  MapLevel<
    [
      Corridor<"that the tunnel you're in continues", GameMap[3]>,
      Wall,
      Item<
        "Locked Chest",
        {
          "Use the Small key": ["Small Key", "chest.unlock"];
          "Force it open": [undefined, "chest.force"];
          "Leave it": [undefined, "chest.leave"];
        }
      >
    ]
  >,
  MapLevel<[Corridor<"that keep following the tunel seems to be your only option", GameMap[4]>, Wall, Wall]>,
  MapLevel<
    [
      Wall,
      Room<
        "a door - and you can feel air current comming from below it",
        "You open the door to a completely dark room. As the door slams shut behind you notice another door on the left wall and... lot's of venomous spiders",
        {
          "Exit through the other door": [undefined, "spidersRoomEastDoor.runForDoor"];
          "Put on the mask": ["Spider Mask", "spidersRoom.putMask"];
        }
      >,
      Wall
    ]
  >
];

type Directions = ["On your left you notice", "In front of you there's", "On your right you see"];

type DescribeMapLevel<TMapLevel extends MapLevel> = TMapLevel["level"] extends infer TLevel
  ? List.Join<
      {
        [Index in keyof TLevel]: TLevel[Index] extends Wall
          ? ""
          : TLevel[Index] extends MapElement
          ? `${Get<Directions, Index>} ${TLevel[Index]["description"]}.`
          : TLevel[Index];
      },
      " "
    >
  : never;

// Lists only the Actions currenlty available to the player
type ListActions<TGameState extends GameState, TActions = TGameState[1]["position"]["actions"]> = Obj.KeyWithValue<
  TActions,
  [undefined | TGameState[1]["inventory"][number], any]
>;

type Move<
  TGameState extends GameState,
  TAction extends keyof TGameState[1]["position"]["actions"],
  TCurrentPosition extends MapLevel
> = Get<TCurrentPosition, ["actions", TAction, 1]> extends infer TDirection
  ? Get<TCurrentPosition, ["level", TDirection]> extends infer TTargetElement
    ? TTargetElement extends Wall
      ? [`You can't go this way. ${DescribeMapLevel<TCurrentPosition>}`, TGameState[1]]
      : TTargetElement extends Corridor
      ? [DescribeMapLevel<TTargetElement["target"]>, Obj.Update<TGameState[1], { position: TTargetElement["target"] }>]
      : TTargetElement extends Room
      ? [
          `${TTargetElement["insideDescription"]}. Your available actions are: ${List.Join<
            Union.ToTuple<ListActions<TGameState, TTargetElement["actions"]>>,
            ", "
          >}`,
          Obj.Update<TGameState[1], { position: TTargetElement }>
        ]
      : TTargetElement extends Item
      ? [
          `You reach for the ${TTargetElement["description"]}. Your available actions are: ${List.Join<
            Union.ToTuple<ListActions<TGameState, TTargetElement["actions"]>>,
            ", "
          >}`,
          Obj.Update<TGameState[1], { position: TTargetElement }>
        ]
      : TTargetElement
    : never
  : never;

type CheckActionResult<TGameState extends GameState> = TGameState[1] extends never
  ? TGameState
  : TGameState[1]["health"] extends 0
  ? [`${TGameState[0]} You are Dead - Game Over!`, null]
  : TGameState[1]["position"] extends MapLevel
  ? [`${TGameState[0]} ${DescribeMapLevel<TGameState[1]["position"]>}`, TGameState[1]]
  : TGameState;

export type Act<
  TGameState extends GameState,
  TAction extends ListActions<TGameState>,
  TPlayerState extends PlayerState = TGameState[1]
> = TPlayerState["position"] extends infer TCurrentPosition
  ? TCurrentPosition extends MapLevel
    ? Move<TGameState, TAction, TCurrentPosition>
    : TCurrentPosition extends InteractiveMapElement
    ? Actions<TPlayerState>[TCurrentPosition["actions"][TAction][1]] extends infer TSelectedAction
      ? TSelectedAction extends GameState
        ? CheckActionResult<TSelectedAction>
        : never
      : never
    : never
  : never;

type NewState = {
  health: 2;
  inventory: [];
  position: GameMap[0];
};

export type NewGame = [
  `Welcome Adventurer. You locked yourself in this dungeon and you can't go back. ${DescribeMapLevel<
    NewState["position"]
  >} Use the type Act<TGameState, TAction>.`,
  NewState
];
