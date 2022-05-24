import { Disclosure, Popover, Transition } from '@headlessui/react'
import { NavLink as RemixNavLink } from '@remix-run/react'
import * as React from 'react'
import { AlgorandIcon, ChevronDownIcon, MenuIcon, XIcon } from '~/components/icons'
import { ConfigContext, SiteConfig } from '~/models/siteConfig'

interface Link {
  name: string
  href: string
  target?: string | undefined
  subItems?: Link[]
}

const createNavigation = (siteContext: SiteConfig) =>
  [
    { name: 'Home', href: '/' },
    { name: 'MakerX', href: 'https://makerx.com.au/', target: '_blank' },
  ] as Link[]

function NavLink(props: { currentClasses: string; defaultClasses: string; link: Link; displayName?: string }) {
  return (
    <>
      {!props.link.href ? (
        <></>
      ) : props.link.href.match(/^https?:\/\//) ? (
        <a href={props.link.href} className={props.defaultClasses} target={props.link.target}>
          {props.link.name}
        </a>
      ) : (
        <RemixNavLink
          to={props.link.href}
          className={(p) => (p.isActive ? props.currentClasses : props.defaultClasses)}
        >
          {props.displayName ?? props.link.name}
        </RemixNavLink>
      )}
    </>
  )
}

export default function SiteHeader() {
  const configContext = React.useContext(ConfigContext)
  const navigation = createNavigation(configContext)

  return (
    <Disclosure as="nav" className="border-b border-solid border-grey shadow-sm shadow-grey">
      {({ open }) => (
        <div className="max-w-4xl mx-auto">
          {/*Header Content*/}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/*Site Icon + Name */}
              <a href="/" className="my-auto cursor-pointer">
                <AlgorandIcon />
              </a>
              {/* Desktop Header */}
              <div className="hidden sm:flex sm:flex-col sm:justify-between">
                {/*Site Links*/}
                <Popover.Group as="nav" className="hidden sm:flex sm:space-x-5 md:space-x-10 -mb-[1px] cursor-pointer">
                  {navigation
                    .filter((nl) => nl.name)
                    .map((link, idx) =>
                      link.subItems && link.subItems.length > 0 ? (
                        // menu group
                        <Popover className="relative" key={idx}>
                          <Popover.Button
                            className={
                              () =>
                                // isExhibitionActive
                                'border-transparent text-grey-dark hover:border-grey inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                              // : 'border-primary text-primary2-darkest inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
                            }
                          >
                            {link.name}
                            <ChevronDownIcon
                              className={'text-grey-dark ml-2 h-5 w-5 group-hover:text-grey'}
                              aria-hidden="true"
                            />
                          </Popover.Button>

                          <Transition
                            as={React.Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                          >
                            <Popover.Panel className="absolute z-10 -ml-4 mt-3 transform px-2 w-52 max-w-md sm:px-0 lg:ml-0 lg:left-1/2 lg:-translate-x-1/2">
                              <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                                <div className="relative grid bg-white sm:gap-8 sm:p-4">
                                  {link.subItems?.map((subItem, idx) => (
                                    <Popover.Button key={idx}>
                                      <RemixNavLink
                                        key={subItem.name}
                                        to={subItem.href}
                                        className={
                                          'text-grey-dark hover:border-grey inline-flex items-center px-1 pt-1 text-sm font-medium'
                                        }
                                      >
                                        {subItem.name}
                                      </RemixNavLink>
                                    </Popover.Button>
                                  ))}
                                </div>
                              </div>
                            </Popover.Panel>
                          </Transition>
                        </Popover>
                      ) : (
                        // single menu item
                        <NavLink
                          key={link.name}
                          link={link}
                          defaultClasses="border-transparent text-grey-dark hover:border-grey inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                          currentClasses="border-primary text-primary2-darkest inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                        />
                      )
                    )}
                </Popover.Group>
              </div>
              {/* Mobile Menu Open/Close */}
              <div className="sm:hidden -mr-2 flex items-center">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-grey hover:text-grey hover:bg-grey-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-grey-dark">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>
          {/*Mobile Site Links*/}
          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2">
              {navigation.map((link) =>
                link.subItems && link.subItems.length > 0 ? (
                  link.subItems.map((item) => (
                    <Disclosure.Button as="span" key={item.name}>
                      <NavLink
                        link={item}
                        displayName={`${link.name} - ${item.name}`}
                        defaultClasses="border-transparent text-grey-dark hover:bg-grey-light hover:border-grey hover:text-black block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                        currentClasses="bg-primary-light border-primary text-primary2-darkest block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                      />
                    </Disclosure.Button>
                  ))
                ) : (
                  <Disclosure.Button as="span" key={link.name}>
                    <NavLink
                      link={link}
                      defaultClasses="border-transparent text-grey-dark hover:bg-grey-light hover:border-grey hover:text-black block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                      currentClasses="bg-primary-light border-primary text-primary2-darkest block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                    />
                  </Disclosure.Button>
                )
              )}
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  )
}
