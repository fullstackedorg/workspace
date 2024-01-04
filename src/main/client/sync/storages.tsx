import useAPI from "@fullstacked/webapp/client/react/useAPI";
import React, { FormEvent, FormEventHandler, useEffect, useState } from "react";
import { client } from "../client";
import type Sync from "../../server/sync";

type StorageType = Awaited<ReturnType<Sync["api"]["storages"]["list"]>>[0]
type StorageTypeWithChild = Awaited<ReturnType<Sync["api"]["storages"]["list"]>>[0] & { child?: StorageType[] }

const list2tree = (storages: StorageType[]): StorageTypeWithChild[] => {
    console.log(storages);
    const tree = {
        root: {
            child: []
        }
    };

    for (const storage of storages) {

        if (storage.cluster) {
            const parentStorage = storages.find(({ origin }) => origin === storage.cluster) as StorageTypeWithChild;

            if (parentStorage) {
                if (!parentStorage.child)
                    parentStorage.child = [];
                parentStorage.child.push(storage)
            }
            else
                tree.root.child.push(storage);
        }
        else {
            tree.root.child.push(storage);
        }
    }

    return tree.root.child;
}

export default function () {
    const [storages, setStorages] = useState(null);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        client.get().storages.list()
            .then(storagesResponse => setStorages(list2tree(storagesResponse)))
    }, [])

    const submit = (e: FormEvent) => {
        e.preventDefault();
        client.post().storages.add(inputValue); 
    }

    return <div style={{color: "white"}}>
        <ul>
            {storages?.map(storage => <RecursiveStorageRender storage={storage} />)}
        </ul>
        <form onSubmit={submit}>
            Add Storage
            <input value={inputValue} onChange={(e) => setInputValue(e.currentTarget.value)} />
        </form>
    </div>
}

function RecursiveStorageRender(props: { storage: StorageTypeWithChild }) {
    if (!props.storage.child) {
        return <li>
            {props.storage.name || props.storage.origin} 
            {!props.storage.keys
                && <button 
                    className="small"
                    onClick={() => client.post().storages.add(props.storage.origin)}
                >
                    Add
                </button>}
        </li>
    }

    return <li>
        {props.storage.name || props.storage.origin}
        <ul>{props.storage.child.map(children => <RecursiveStorageRender storage={children} />)}</ul>
    </li>
}
