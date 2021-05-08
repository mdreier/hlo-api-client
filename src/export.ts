/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Definition of the export format.
 */
interface ExportFormat {
    /**
     * The portfolio section provides basic details about the character and the export data returned.
     */
    portfolio: {
        /**
         * Unique identifier for the character within HLO
         */
        charId: string,
        /**
         * Current version of the character within HLO. Whenever a character is modified in some way,
         * its version is increased, and this value reflects the version at the time it was exported.
         */
        version: number,
        /**
         * Baseline version of the character against which a differential export was generated.
         * Character data can become large and only small portions may change. The export mechanism
         * can optionally report only the differences between an older version and the current
         * version. The baseline indicates the older version that the export contains the differences
         * from. A baseline of zero indicates the full character is reported.
         */
        baseline: number
    },
    /**
     * The metadata section outlines an assortment of important internal details about HLO that can
     * impact the export contents. The "metadata" object is only included when a full export occurs.
     */
    metadata?: {
        /**
         * Unique identifier for the game system within HLO
         */
        gameCode: string,
        /**
         * Friendly name of the game system to which the character applies
         */
        gameName: string,
        /**
         * Major version number of the game system data files. Each game system has distinct data
         * files with its own version. When the major version changes, the contents of an export
         * are likely to change in some manner, so differential exports acrossmajor version changes
         * should not be used.
         */
        gameMajor: number,
        /**
         * Minor version number of the game system data files. When the minor version changes,
         * differential exports should be safe, as this typically indicates smaller changes and
         * bug fixes.
         */
        gameMinor: number,
        /**
         * Version of the HLO engine. Changes to the engine should not typically impact the export
         * data, but this value could be helpful in isolating bugs.
         */
        hloVersion: number,
        /**
         * Version of the export format itself. When this changes, there could be implications
         * across the export format.
         */
        exportVersion: number,
        /**
         * Copyright statement.
         */
        legal?: string
    },
    /**
     * The actors section is the meat of the export format, as it contains all of the actual character
     * information. The "actors" object is always present and holds one or more properties that
     * identify the various individual actors that comprise the overall character. If a character is a
     * simple Fighter, then there will be a single actor, but more complex characters may have minions
     * that are also included as separate actors (e.g. animal companions, drones, etc.).
     *
     * Each actor is identified by a unique value that never changes. The primary character is always
     * assigned a value of one (and sometimes referred to as the lead actor). The list of properties
     * within the actors section is simply a list of the actors by their id, with the lead actor
     * always appearing first. Within each of these properties, the full details of that actor will be
     * found as an object, making each a self-contained unit.
     */
    actors: {
        /**
         * The structure of an actorobjectbreaks down the actor into a small number of standard
         * aspects and the game-specific details.
         */
        [actorName: string]: {
            /**
             * Name given to the actor by the user.
             */
            name: string,
            /**
             * Name of the player controlling the character (as entered by the user).
             */
            player: string,
            /**
             * Object containing all of the game-specific properties for the actor. These are all
             * simple properties, so please refer to the specific game system section for details.
             */
            gameValues: GameValues,
            /**
             * Object containing the collection of game-specific elements that comprise the
             * character, encompassing all ability scores, skills, equipment, spells, etc.
             *
             * Within the "items" object, the structure is similar to the "actors" object. Each
             * item is a uniquely named property within the object. It is possible that two items
             * on a character represent the same general entity (e.g. two separate daggers), so
             * each incorporates a unique value that guarantees distinction.
             */
            items: {
                [itemId: string]: BaseItem
            }
        }
    },

    /**
     * Items will occasionally be deleted from a character. When this occurs, the differential
     * export will include a new property named "deletedItems". This property will appear at
     * the topmost level and is an object that lists every item deleted from any actors across
     * the entire portfolio. Each deleted item is an object whose name is the deleted item
     * and whose lone property identifies the containing item from which it was deleted.
     */
    deletedItems? : {
        [itemId: string]: {
            /**
             * Item that previously contained the deleted item(null when deleted directly from
             * the actor and not a containingitem)
             */
            fromItem: string | null,
            /**
             * Actor that previously possessed the deleted item.
             */
            fromActor: string
        }
    },

    /**
     * Items can also be moved from one location within the character to another.When this occurs,
     * the moved item will disappear from beneath its old container and appear beneath its new
     * container. In addition, the differential export will include a new object named "movedItems"
     * at the topmost level. This object contains entries for each item that has been moved anywhere
     * within the portfolio, where each identifies both the containing items from which it was moved
     * and the new item that it now appears beneath.
     */
    movedItems? : {
        [itemId: string]: {
            /**
             * Item that previously contained the moved item (nullwhen moved directly from the actor
             * and not a containing item).
             */
            fromItem: string | null,
            /**
             * Actor that previously possessed the moved item.
             */
            fromActor: string,
            /**
             * Item beneath which the moved item now resides(null when moved directly to an actor
             * and not into a containing item).
             */
            toItem: string | null,
            /**
             * Actor that now possesses the moved item.
             */
            toActor: string
        }
    },

    /**
     * Deleting an actor from a character causes two different behaviors. First, a new "deletedActors"
     * property appears at the topmost levelthat contains an array of the actors that have been deleted.
     * Secondly, all of the items belonging to the actor that were deleted are included within the
     * "deletedItems" object.
     *
     * The primary character can never be deleted, so the actor with id 1 will always be present. All
     * other actors can come and go, but "actor.1" will always remain.
     */
    deletedActors?: string[]
}

/**
 * Base interface for game values.
 */
interface GameValues {};

/**
 * Each individual item is anobjectwith a collection of properties. A fewof these properties are
 * standard across all game systems, with the rest being game-specific.
 */
interface BaseItem {
    /**
     * Name of the item for display.
     */
    name: string,
    /**
     * Full description of the item for presentation to the user.
     */
    description: string,
    /**
     * Short summary of the item for display to the user.
     */
    summary: string,
    /**
     * Identifies the grouping of related items to which this one belongs. For example, all ability
     * scores will have the same compset, all skills will have the same compset, etc.
     */
    compset: string,
    /**
     * There are frequently situations where items will be nested in the export. Typical examples include
     * complex items built from multiple component items, items slotted into another (e.g. batteries and
     * ammo for weapons), and gear stored within other gear. When any of these situations arise, any items
     * held within another will appear within an "items" object on the containing item, and each such item
     * will have an additional property that indicates the nature of the containment.
     */
    items?: {
        [itemId: string]: StoredItem
    }
}

/**
 * There are frequently situations where items will be nested in the export. Typical examples include
 * complex items built from multiple component items, items slotted into another (e.g. batteries and
 * ammo for weapons), and gear stored within other gear. When any of these situations arise, any items
 * held within another will appear within an "items" object on the containing item, and each such item
 * will have an additional property that indicates the nature of the containment.
 */
interface StoredItem extends BaseItem {
    /**
     * Means by which the item is contained  - one of:
     * * Installed - Item is mounted within its container for use (e.g. ammo or a battery)
     * * Stored - Item is placed in its container for storage (e.g. food in a backpack)
     */
    Containment: "Installed" | "Stored"
}

/**
 * Game values for the Starfinder game system.
 */
interface GameValuesStarfinder extends GameValues {
    /**
     * Challenge rating for the character. Values from 1 upwards indicate that number as the CR. Other
     * values and their meanings are: 0 = 1/2, -1 = 1/3, -2 = 1/4
     */
    actCR: number,
    /**
     * Amount of XP awarded when the actor is vanquished by the PCs.
     */
    actXPAward: number,
    /**
     * Size rating of the character. See Size constants.
     */
    actSize: number,
    /**
     * Size rating of the weapons that can be comfortably wielded by the character. See Size constants.
     */
    actSizeWeapon: number,
    /**
     * Net encumbrance rating of the character. See CarryingLevel constants.
     */
    actCarryingLevel: number,
    /**
     * Bulk threshold at which the actor becomes Encumbered.
     */
    actEncumbered: number,
    /**
     * Bulk threshold at which the actor becomes Overburdened.
     */
    actOverburdened: number,
    /**
     * Current level of the character without any adjustments applied.
     */
    actLevel: number,
    /**
     * Current level of the character with adjustments applied, such as negative level effects.
     */
    actLevelNet: number,
    /**
     * Starfinder Society ID for the player, as issued by the SFS.
     */
    actSocietyId: number,
    /**
     * Starfinder Society ID for the character, as assigned by the player and starting at 701. When
     * combined with the actSocietyId, a unique id is generated for the character.
     */
    actSocietyChar: number,
    /**
     * Net Fame possessed by the character for use in Starfinder Society play.
     */
    actFameNet: number
}

/**
 * Items for the Starfinder Game System
 */
interface ItemStarfinder extends BaseItem {
    /**
     * Type of ability.
     */
    AbilType?: "SpellLike" | "Super" | "Extra",

    /**
     * Interval at which an ability or other resource can be used (e.g. Day, Hour).
     * When combined with the trkMaximum property, it identifies the actual frequency,
     * such as 3/Day or 1/Hour.
     */
    Period?: string,

    /**
     * requency at which an ability or resource can be used as one of these values:
     * AtWill, Constant, OneDFourRd (usable every 1d4 rounds), or OneDSixRd (usable
     * every 1d6 rounds).
     */
    UsageSpec?: "AtWill" | "Constant" | "OneDFourRd" | "OneDSixRd",

    /**
     * Stipulates specific situations under which adjustments are conferred, typically
     * for an ability. For example, Perception might have a "+2 vs Sight" value, which
     * means a +2 bonus to Perception is conferred on site-based checks.
     */
    sitEffect?: string,

    /**
     * Indicates the Augment category that applies.
     */
    AugmentCat?: "Biotech" | "Cyber" | "Magitech" | "Necrograft" | "Personal" | "Symbiend", // TODO: Check if "Symbiend" is correct might be "Symbiond"

    /**
     * Base level of a spell, which can then be adjusted for use.
     */
    spLevelBase?: number,

    /**
     * Net adjusted level of a memorized spell.
     */
    spLevelNet?: number,

    /**
     * Indicates whether an SFS boon has been slotted for use, with a value of 1 indicating slotted
     */
    bnIsSlotted?: number,

    /**
     * Specifies the fly speed maneuverability. Only ever assigned to the mvFly item.
     */
    Maneuver?: "Perfect" | "Good" | "Average" | "Poor" | "Clumsy",

    /**
     * Bulk of gear. 0 means negligible bulk.
     */
    grBulk?: number
}

/**
 * Game values for the Pathfinder 2 game system.
 */
interface GameValuesPathfinder2 extends GameValues {
    /**
     * Size rating of the character. See Size constants.
     */
    actSize: number,
    /**
     * Net encumbrance rating of the character. See CarryingLevel constants.
     */
    actCarryingLevel: number
}

/**
 * Items for the Pathfinder 2 Game System
 */
interface ItemPathfinder2 extends BaseItem {
    /**
     * When shown on a spell, this is the spell attack roll.
     */
    stNet?: number,

    /**
     * Identifies the level of a feat and the required level of the character to take the feat.
     */
    reqLevelNet?: number,

    /**
     * Identifies the type ofaction the an ability requires for use.
     */
    Action?: "Action1" | "Action2" | "Action3" | "Reaction" | "Free",

    /**
     * Identifies the various traits associated with the item.
     *
     * Traits are a core game concept,and the list of traits increases with each new book published.
     * Trait ids will possess an obvious value that closely parallels the name in the book. In most
     * cases, the trait will have a prefix of 2 or 3 letters. For example, classes will have the "cl"
     * prefix (e.g. "clRogue"),spell schools will have the "ss" prefix,and monster/npc traits will
     * have the "trt" prefix (e.g. "trtDragon" or "trtFire").
     */
    Trait?: string

}

/**
 * Values for actor sizes.
 */
const Size = {
    Fine: -4,
    Diminutive: -3,
    Tiny: -2,
    Small: -1,
    Medium: 0,
    Large: 1,
    Huge: 2,
    Gargantuan: 3,
    Colossal: 4
} as const;

/**
 * Values for the carrying level.
 */
const CarryingLevel = {
    Unencumbered: 0,
    Encumbered: 1,
    Overburdened: 2
} as const;

export { ExportFormat, GameValues, BaseItem, StoredItem, Size, CarryingLevel, GameValuesStarfinder, ItemStarfinder, GameValuesPathfinder2, ItemPathfinder2 };