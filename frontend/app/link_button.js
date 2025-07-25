"use client"

import { useRouter } from "next/navigation";
import styles from "@/app/styles/auth.module.css"

export function LinkButton(props) {
    const router = useRouter();
    console.log(props)

    return (
        <button className={styles.button2} type='button' onClick={()=>router.push(props.Link)}>
            {props.TextContent}
        </button>
    )
}