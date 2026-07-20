import { useMemo } from 'react';
import { useGameState } from '../contexts/GameStateContext';

export const useInventory = () => {
  const {
    player,
    items,
    equipItem,
    unequipItem,
    consumePotion,
    buyItem,
    sellItem
  } = useGameState();

  // Hydrate player's raw inventory [{ itemId, quantity }] with complete item details
  const hydratedInventory = useMemo(() => {
    if (!player || !player.inventory) return [];
    
    return player.inventory.map((invItem) => {
      const details = items.find((i) => i.id === invItem.itemId);
      return {
        ...invItem,
        details: details || {
          id: invItem.itemId,
          name: 'Unknown Item',
          type: 'misc',
          statName: 'none',
          statValue: 0,
          cost: 0,
          description: 'No details available.'
        }
      };
    });
  }, [player, items]);

  // Retrieve complete item objects of currently equipped items
  const equippedDetails = useMemo(() => {
    if (!player || !player.equippedItems) return { weapon: null, armor: null, accessory: null };

    const { weapon, armor, accessory } = player.equippedItems;

    return {
      weapon: items.find(i => i.id === weapon) || null,
      armor: items.find(i => i.id === armor) || null,
      accessory: items.find(i => i.id === accessory) || null
    };
  }, [player, items]);

  // Filter shop inventory items that are available for purchase
  const shopItems = useMemo(() => {
    return items.filter(i => i.cost > 0);
  }, [items]);

  return {
    inventory: hydratedInventory,
    equipped: equippedDetails,
    shopItems,
    equip: equipItem,
    unequip: unequipItem,
    usePotion: consumePotion,
    buy: buyItem,
    sell: sellItem
  };
};

export default useInventory;
