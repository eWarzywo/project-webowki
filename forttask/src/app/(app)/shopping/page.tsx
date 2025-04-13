import ShoppingForm from '@/components/shoppingList/shoppingForm';
import ShoppingListHandler from '@/components/shoppingList/shoppingListHandler';

export default function Shopping() {
    return (
        <>
            <div className="flex w-full shrink-0 self-stretch gap-[10px]">
                <ShoppingForm />
                <ShoppingListHandler />
            </div>
        </>
    );
}
