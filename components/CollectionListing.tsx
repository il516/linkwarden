import React, { useEffect, useMemo, useState } from "react";
import Tree, {
  mutateTree,
  moveItemOnTree,
  RenderItemParams,
  TreeItem,
  TreeData,
  ItemId,
  TreeSourcePosition,
  TreeDestinationPosition,
} from "@atlaskit/tree";
import useCollectionStore from "@/store/collections";
import { Collection } from "@prisma/client";
import Link from "next/link";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useRouter } from "next/router";

interface ExtendedTreeItem extends TreeItem {
  data: Collection;
}

const CollectionListing = () => {
  const { collections } = useCollectionStore();

  const router = useRouter();

  const currentPath = router.asPath;

  const initialTree = useMemo(() => {
    if (collections.length > 0) {
      return buildTreeFromCollections(collections, router);
    }
    return undefined;
  }, [collections, router]);

  const [tree, setTree] = useState(initialTree);

  useEffect(() => {
    setTree(initialTree);
  }, [initialTree]);

  const onExpand = (itemId: ItemId) => {
    setTree((currentTree) =>
      mutateTree(currentTree!, itemId, { isExpanded: true })
    );
  };

  const onCollapse = (itemId: ItemId) => {
    setTree((currentTree) =>
      mutateTree(currentTree as TreeData, itemId, { isExpanded: false })
    );
  };

  const onDragEnd = (
    source: TreeSourcePosition,
    destination: TreeDestinationPosition | undefined
  ) => {
    if (!destination || !tree) {
      return;
    }
    setTree((currentTree) => moveItemOnTree(currentTree!, source, destination));
  };

  if (!tree) {
    return <></>;
  } else
    return (
      <Tree
        tree={tree}
        renderItem={(itemProps) => renderItem({ ...itemProps }, currentPath)}
        onExpand={onExpand}
        onCollapse={onCollapse}
        onDragEnd={onDragEnd}
        isDragEnabled
        isNestingEnabled
      />
    );
};

export default CollectionListing;

const renderItem = (
  { item, onExpand, onCollapse, provided }: RenderItemParams,
  currentPath: string
) => {
  const collection = item.data;

  return (
    <div ref={provided.innerRef} {...provided.draggableProps} className="mb-1">
      <div
        className={`${
          currentPath === `/collections/${collection.id}`
            ? "bg-primary/20 is-active"
            : "hover:bg-neutral/20"
        } duration-100 flex gap-1 items-center pr-2 pl-1 rounded-md`}
      >
        {Icon(item as ExtendedTreeItem, onExpand, onCollapse)}

        <Link
          href={`/collections/${collection.id}`}
          className="w-full"
          {...provided.dragHandleProps}
        >
          <div
            className={`py-1 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <i
              className="bi-folder-fill text-2xl drop-shadow"
              style={{ color: collection.color }}
            ></i>
            <p className="truncate w-full">{collection.name}</p>

            {collection.isPublic ? (
              <i
                className="bi-globe2 text-sm text-black/50 dark:text-white/50 drop-shadow"
                title="This collection is being shared publicly."
              ></i>
            ) : undefined}
            <div className="drop-shadow text-neutral text-xs">
              {collection._count?.links}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

const Icon = (
  item: ExtendedTreeItem,
  onExpand: (id: ItemId) => void,
  onCollapse: (id: ItemId) => void
) => {
  if (item.children && item.children.length > 0) {
    return item.isExpanded ? (
      <button onClick={() => onCollapse(item.id)}>
        <div className="bi-caret-down-fill opacity-50 hover:opacity-100 duration-200"></div>
      </button>
    ) : (
      <button onClick={() => onExpand(item.id)}>
        <div className="bi-caret-right-fill opacity-40 hover:opacity-100 duration-200"></div>
      </button>
    );
  }
  // return <span>&bull;</span>;
  return <div className="pl-1"></div>;
};

const buildTreeFromCollections = (
  collections: CollectionIncludingMembersAndLinkCount[],
  router: ReturnType<typeof useRouter>
): TreeData => {
  const items: { [key: string]: ExtendedTreeItem } = collections.reduce(
    (acc: any, collection) => {
      acc[collection.id as number] = {
        id: collection.id,
        children: [],
        hasChildren: false,
        isExpanded: false,
        data: {
          id: collection.id,
          parentId: collection.parentId,
          name: collection.name,
          description: collection.description,
          color: collection.color,
          isPublic: collection.isPublic,
          ownerId: collection.ownerId,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
          _count: {
            links: collection._count?.links,
          },
        },
      };
      return acc;
    },
    {}
  );

  console.log("items:", items);

  const activeCollectionId = Number(router.asPath.split("/collections/")[1]);

  if (activeCollectionId) {
    for (const item in items) {
      const collection = items[item];
      if (Number(item) === activeCollectionId && collection.data.parentId) {
        // get all the parents of the active collection recursively until root and set isExpanded to true
        let parentId = collection.data.parentId || null;
        while (parentId) {
          items[parentId].isExpanded = true;
          parentId = items[parentId].data.parentId;
        }
      }
    }
  }

  collections.forEach((collection) => {
    const parentId = collection.parentId;
    if (parentId && items[parentId] && collection.id) {
      items[parentId].children.push(collection.id);
      items[parentId].hasChildren = true;
    }
  });

  const rootId = "root";
  items[rootId] = {
    id: rootId,
    children: (collections
      .filter((c) => c.parentId === null)
      .map((c) => c.id) || "") as unknown as string[],
    hasChildren: true,
    isExpanded: true,
    data: { name: "Root" } as Collection,
  };

  return { rootId, items };
};
