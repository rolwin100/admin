import React, { useState } from "react"
import { Text, Flex, Box, Image } from "rebass"
import { navigate } from "gatsby"
import styled from "@emotion/styled"
import moment from "moment"
import ReactTooltip from "react-tooltip"

import { ReactComponent as Clipboard } from "../../../../assets/svg/clipboard.svg"
import { decideBadgeColor } from "../../../../utils/decide-badge-color"
import Typography from "../../../../components/typography"
import Badge from "../../../../components/badge"
import Button from "../../../../components/button"
import Dropdown from "../../../../components/dropdown"

import useMedusa from "../../../../hooks/use-medusa"

import ClaimEdit from "./edit"

const LineItemLabel = styled(Text)`
  ${Typography.Base};

  cursor: pointer;

  font-size: 10px;
`

const LineItem = ({ lineItem, currency, taxRate }) => {
  const productId = lineItem.variant.product.id

  return (
    <Flex alignItems="center">
      <Flex flex={1} alignItems="center">
        <Box alignSelf={"center"} minWidth={"35px"}>
          {lineItem.quantity} x
        </Box>
        <Box mx={2}>
          <Image
            src={lineItem.thumbnail || ""}
            sx={{
              objectFit: "contain",
              objectPosition: "center",
              width: 35,
              height: 35,
            }}
          />
        </Box>
        <Box>
          <LineItemLabel
            ml={2}
            mr={5}
            onClick={() => navigate(`/a/products/${productId}`)}
          >
            {lineItem.title}
            <br /> {lineItem.variant.sku}
            <br />
            {((100 + taxRate) * lineItem.unit_price) / 10000}{" "}
            {currency.toUpperCase()}
          </LineItemLabel>
        </Box>
      </Flex>
    </Flex>
  )
}

export default ({
  event,
  order,
  onSaveClaim,
  onFulfillClaim,
  onReceiveReturn,
  onCancelClaim,
}) => {
  const { toaster } = useMedusa("store")
  const [showEditClaim, setShowEditClaim] = useState(false)

  const canceled = event.raw.canceled_at !== null
  const [expanded, setExpanded] = useState(!canceled)

  const payStatusColors = decideBadgeColor(event.raw.payment_status)
  const fulfillStatusColors = decideBadgeColor(event.raw.fulfillment_status)

  const actions = []

  actions.push({
    label: "Cancel Claim",
    variant: "danger",
    onClick: () => {
      onCancelClaim(event.raw.id)
    },
  })

  if (
    event.claim_type === "replace" &&
    (event.raw.fulfillment_status === "not_fulfilled" ||
      event.raw.fulfillment_status === "canceled")
  ) {
    actions.push({
      label: "Fulfill Claim",
      onClick: () => {
        onFulfillClaim(event.raw)
      },
    })
  }

  return (
    <Flex>
      <Box width={"100%"} sx={{ borderBottom: "hairline" }} pb={3} mb={3}>
        <Flex mb={4} px={3} width={"100%"} justifyContent="space-between">
          <Box>
            <Flex mb={2} justifyContent="space-between">
              <Text mr={100} fontSize={1} color="grey" fontWeight="500">
                {canceled ? "Claim Canceled" : "Claim Created"}
              </Text>
            </Flex>
            {expanded && (
              <>
                <Text fontSize="11px" color="grey">
                  {moment(event.time).format("MMMM Do YYYY, H:mm:ss")}
                </Text>
                {event.claim_type === "replace" ? (
                  <Flex mt={4}>
                    <Text mr={2} fontSize={1} color="grey">
                      Fulfillment Status
                    </Text>
                    <Badge
                      color={fulfillStatusColors.color}
                      bg={fulfillStatusColors.bgColor}
                    >
                      {event.raw.fulfillment_status}
                    </Badge>
                  </Flex>
                ) : (
                  <Flex mt={4}>
                    <Text mr={2} fontSize={1} color="grey">
                      Payment Status
                    </Text>
                    <Badge
                      color={payStatusColors.color}
                      bg={payStatusColors.bgColor}
                    >
                      {event.raw.payment_status}
                    </Badge>
                  </Flex>
                )}
              </>
            )}
          </Box>

          <Box>
            {actions.length > 0 && !canceled && (
              <Dropdown>
                {actions.map(o => (
                  <Text color={o.variant} onClick={o.onClick}>
                    {o.label}
                  </Text>
                ))}
              </Dropdown>
            )}
            {canceled && (
              <Text onClick={() => setExpanded(!expanded)}>toggle</Text>
            )}
          </Box>
        </Flex>
        {expanded && (
          <>
            <Flex mx={3} justifyContent="space-between" alignItems="center">
              <Box>
                <Flex mb={2}>
                  <Text mr={2}>Claimed items</Text>
                </Flex>
                {event.claim_items.map((lineItem, i) => (
                  <LineItem
                    key={lineItem.id}
                    currency={order.currency_code}
                    lineItem={lineItem}
                    taxRate={order.tax_rate}
                    onReceiveReturn={onReceiveReturn}
                    rawEvent={event.raw}
                  />
                ))}
              </Box>
              <Box>
                {!canceled && (
                  <Button
                    onClick={() => setShowEditClaim(true)}
                    variant="primary"
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Flex>
            {event.claim_type === "replace" ? (
              <Flex mx={3} justifyContent="space-between" alignItems="center">
                <Box>
                  <Flex mt={3} mb={2}>
                    <Text mr={2}>New items</Text>
                  </Flex>
                  {event.items.map((lineItem, i) => (
                    <LineItem
                      key={lineItem.id}
                      currency={order.currency_code}
                      lineItem={lineItem}
                      taxRate={order.tax_rate}
                      onReceiveReturn={onReceiveReturn}
                      rawEvent={event.raw}
                    />
                  ))}
                </Box>
              </Flex>
            ) : (
              <Flex mx={3} justifyContent="space-between" alignItems="center">
                <Box>
                  <Flex mt={3} mb={2}>
                    <Text mr={2}>Amount refunded</Text>
                  </Flex>
                  {event.raw.refund_amount / 100}{" "}
                  {order.currency_code.toUpperCase()}
                </Box>
              </Flex>
            )}
          </>
        )}
      </Box>
      {showEditClaim && (
        <ClaimEdit
          toaster={toaster}
          claim={event.raw}
          order={order}
          onSave={onSaveClaim}
          onDismiss={() => setShowEditClaim(false)}
        />
      )}
    </Flex>
  )
}
